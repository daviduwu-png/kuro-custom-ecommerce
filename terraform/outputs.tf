output "control_plane_public_ip" {
  description = "IP pública del nodo Control Plane"
  value       = aws_instance.kuro_control_plane.public_ip
}

output "worker_public_ip" {
  description = "IP pública del nodo Worker"
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
  description = "DNS name del Application Load Balancer"
  value       = aws_lb.kuro_alb.dns_name
}


output "rds_endpoint" {
  description = "Endpoint de conexión a la base de datos PostgreSQL (actualizar secret DB_HOST en GitHub)"
  value       = aws_db_instance.kuro_postgres.endpoint
}

output "vpc_id" {
  description = "ID de la VPC dedicada de Kuro Custom"
  value       = aws_vpc.kuro_vpc.id
}

output "acm_validation_records" {
  description = "Registros DNS necesarios para validar el certificado SSL en Cloudflare"
  value = {
    for dvo in aws_acm_certificate.kuro_cert.domain_validation_options : dvo.domain_name => {
      Name   = dvo.resource_record_name
      Type   = dvo.resource_record_type
      Target = dvo.resource_record_value
    }
  }
}
