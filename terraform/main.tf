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

# Get GKE ingress IP
data "kubernetes_service" "ingress_nginx" {
  metadata {
    name      = "ingress-nginx-controller"
    namespace = "default"  # Update if you installed in different namespace
  }
  depends_on = [
    google_container_cluster.primary,
    # Add local exec to ensure ingress is installed
    null_resource.install_ingress
  ]
}

# Ensure ingress controller is installed
resource "null_resource" "install_ingress" {
  depends_on = [google_container_cluster.primary]
  
  provisioner "local-exec" {
    command = <<-EOT
      helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
      helm repo update
      helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx
    EOT
  }
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

# DNS Records using GKE ingress IP
resource "google_dns_record_set" "frontend" {
  name         = google_dns_managed_zone.default.dns_name
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.default.name
  rrdatas      = [data.kubernetes_service.ingress_nginx.status[0].load_balancer[0].ingress[0].ip]
}

resource "google_dns_record_set" "backend" {
  name         = "api.${google_dns_managed_zone.default.dns_name}"
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.default.name
  rrdatas      = [data.kubernetes_service.ingress_nginx.status[0].load_balancer[0].ingress[0].ip]
}