# outputs.tf
output "cluster_endpoint" {
  value       = google_container_cluster.primary.endpoint
  sensitive   = true  
}

output "registry_url" {
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}"
  sensitive = true
}

output "github_actions_key" {
  value       = google_service_account_key.github_key.private_key
  sensitive   = true  
}