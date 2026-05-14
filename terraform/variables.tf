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