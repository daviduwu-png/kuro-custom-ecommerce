# Base de Datos

variable "db_user" {
  description = "Usuario administrador para PostgreSQL"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Contraseña para PostgreSQL"
  type        = string
  sensitive   = true
}

# Cómputo (EC2)

variable "ec2_key_name" {
  description = "Nombre del Key Pair existente en AWS para acceder por SSH a las instancias EC2"
  type        = string
  default     = null
}

variable "allowed_ssh_cidr" {
  description = "CIDR desde el cual se permite SSH a las instancias EC2. Usar la IP pública del operador (ej: '203.0.113.5/32'). NUNCA usar '0.0.0.0/0' en produccion."
  type        = string
}

# Red / Seguridad

variable "default_egress_allowed_cidrs" {
  description = "CIDRs de egress para el Security Group de los nodos EC2. Requiere 0.0.0.0/0 para que K8s pueda jalar imágenes y paquetes."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# ALB

variable "alb_allowed_cidrs" {
  description = "Lista de CIDRs permitidos para acceder al ALB por HTTP/HTTPS. Usar '0.0.0.0/0' para sitio público."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "alb_egress_allowed_cidrs" {
  description = "Lista de CIDRs permitidos para el tráfico de salida del ALB."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "alb_ssl_policy" {
  description = "Política SSL para el listener HTTPS del ALB. Usar una política estricta TLS 1.2+ en producción."
  type        = string
  default     = "ELBSecurityPolicy-TLS-1-2-2017-01"
}

variable "alb_enable_deletion_protection" {
  description = "Habilita la protección contra eliminación del ALB. Poner true en producción; false en CI/workflows de destroy."
  type        = bool
  default     = false
}

variable "alb_logs_bucket_name" {
  description = "Opcional: nombre del bucket S3 para los access logs del ALB. Si está vacío, Terraform genera un nombre único."
  type        = string
  default     = ""
}

# Cloudflare DNS Automático

variable "cloudflare_api_token" {
  description = "Token de API de Cloudflare con permisos de edición de DNS"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "ID de la zona (dominio) en Cloudflare"
  type        = string
  sensitive   = true
}