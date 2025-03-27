provider "google" {
  project = var.project_id
  region  = var.region
}

terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
    }
    kubernetes = {
      source = "hashicorp/kubernetes"
    }
    helm = {
      source = "hashicorp/helm"
    }
  }
}

provider "helm" {
  kubernetes {
    host                   = "https://${data.google_container_cluster.primary.endpoint}"
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(data.google_container_cluster.primary.master_auth[0].cluster_ca_certificate)
  }
}

# Get GKE cluster access token
data "google_client_config" "default" {}

provider "kubernetes" {
  host                   = "https://${data.google_container_cluster.primary.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(data.google_container_cluster.primary.master_auth[0].cluster_ca_certificate)
}

data "google_container_cluster" "primary" {
  name     = google_container_cluster.primary.name
  location = google_container_cluster.primary.location
}

data "google_client_openid_userinfo" "current" {}

# User IAM 
resource "google_project_iam_binding" "user_permissions" {
  for_each = toset([
    "roles/owner",
    "roles/iam.serviceAccountAdmin"
  ])
  
  project = var.project_id
  role    = each.key
  members = ["user:${data.google_client_openid_userinfo.current.email}"]
}

# GKE Cluster
resource "google_container_cluster" "primary" {
  name           = "${var.project_id}-cluster"
  location       = var.region
  enable_autopilot = true

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }
}

resource "google_storage_bucket" "prompts" {
  name     = "system_prompts"
  location = var.region
  uniform_bucket_level_access = true
}

# Artifact Registry
resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = "connor-is-ai"
  description   = "Docker repository for connor-is-ai"
  format        = "DOCKER"
  
  labels = {
    environment = "dev"
    managed-by  = "terraform"
  }
}

# GitHub Actions Service Account
resource "google_service_account" "github_actions" {
  account_id   = "github-actions"
  display_name = "GitHub Actions"
  description  = "Service account for GitHub Actions"
  project      = var.project_id
}

resource "google_project_iam_binding" "github_actions_permissions" {
  for_each = toset([
    "roles/container.developer",
    "roles/storage.admin",
    "roles/artifactregistry.admin",
    "roles/secretmanager.secretAccessor"
  ])
  
  project = var.project_id
  role    = each.key
  members = ["serviceAccount:${google_service_account.github_actions.email}"]
}

resource "google_service_account_key" "github_key" {
  service_account_id = google_service_account.github_actions.id
}

resource "google_secret_manager_secret" "app_secrets" {
  for_each = toset([
    "OPENAI_API_KEY",
    "TAVILY_API_KEY",
    "LANGCHAIN_API_KEY", 
    "GITHUB_TOKEN",
    "CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "DB_PASSWORD",
    "DB_DIRECT_URL",
    "DB_HOST",
    "DB_USER",
  ])

  secret_id = each.key
  project   = var.project_id

  replication {
    auto {}
  }
}

# GKE Service Account
resource "google_service_account" "gcs_access" {
  account_id   = "gcs-access-sa"
  display_name = "GCS Access Service Account"
}

resource "google_storage_bucket_iam_member" "bucket_access" {
  bucket = google_storage_bucket.prompts.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.gcs_access.email}"
}

resource "kubernetes_service_account" "workload_identity" {
  metadata {
    name = "gcs-access-ksa"
    namespace = "default"
    annotations = {
      "iam.gke.io/gcp-service-account" = google_service_account.gcs_access.email
    }
  }
}

resource "google_service_account_iam_binding" "workload_identity" {
  service_account_id = google_service_account.gcs_access.name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[default/gcs-access-ksa]"
  ]
}

# DNS Zone
resource "google_dns_managed_zone" "default" {
  name        = "connor-haines-com"
  dns_name    = "connor-haines.com."
  description = "DNS zone for domain: connor-haines.com"

  dnssec_config {
    state = "on"
  }
}

# Static IPs for Ingress
resource "google_compute_global_address" "frontend_ip" {
  name = "frontend-static-ip"
}

resource "google_compute_global_address" "backend_ip" {
  name = "backend-static-ip"
}

resource "google_dns_record_set" "frontend" {
  name         = google_dns_managed_zone.default.dns_name
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.default.name
  rrdatas      = [google_compute_global_address.frontend_ip.address]
}

resource "google_dns_record_set" "backend" {
  name         = "api.${google_dns_managed_zone.default.dns_name}"
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.default.name
  rrdatas      = [google_compute_global_address.backend_ip.address]
}