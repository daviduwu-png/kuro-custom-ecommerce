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

variable "ec2_key_name" {
  description = "Nombre del Key Pair existente en AWS para acceder por SSH a las instancias EC2"
  type        = string
  default     = null
}

variable "allowed_ssh_cidr" {
  description = "CIDR desde el cual se permite SSH a las instancias EC2. Usar la IP pública del operador (ej: '203.0.113.5/32'). NUNCA usar '0.0.0.0/0' en produccion."
  type        = string
}