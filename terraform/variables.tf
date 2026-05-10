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