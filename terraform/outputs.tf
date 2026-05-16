output "control_plane_public_ip" {
  description = "Public IP del nodo Control Plane"
  value       = aws_instance.kuro_control_plane.public_ip
}

output "worker_public_ip" {
  description = "Public IP del nodo Worker"
  value       = aws_instance.kuro_worker.public_ip
}

output "control_plane_instance_id" {
  description = "Instance ID del nodo Control Plane"
  value       = aws_instance.kuro_control_plane.id
}

output "worker_instance_id" {
  description = "Instance ID del nodo Worker"
  value       = aws_instance.kuro_worker.id
}

output "alb_dns_name" {
  description = "El DNS name del Application Load Balancer"
  value       = aws_lb.kuro_alb.dns_name
}
