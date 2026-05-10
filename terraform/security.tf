resource "aws_security_group" "seguridad_kuro" {
  name        = "sg_kuro_custom"
  description = "Grupo de seguridad base para nodos de Kuro Custom"

  # Regla de entrada: Permitir tráfico SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Regla de salida: Permitir todo el tráfico saliente
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Proyecto = "Kuro-Custom"
    Entorno  = "Laboratorio"
  }
}