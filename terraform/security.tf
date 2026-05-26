resource "aws_security_group" "seguridad_kuro" {
  name        = "sg_kuro_custom"
  description = "Grupo de seguridad base para nodos de Kuro Custom"
  vpc_id      = aws_vpc.kuro_vpc.id

  # Regla de entrada: SSH restringido a la IP del operador
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
    description = "SSH solo desde IP autorizada del operador"
  }


  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    self        = true
    description = "Kubernetes API Server - Solo trafico interno entre nodos"
  }

  ingress {
    from_port       = 30000
    to_port         = 32767
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  # Tráfico interno entre nodos/servicios del laboratorio (K8s + RDS)
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
    description = "Trafico interno irrestricto entre nodos del cluster (K8s inter-node, etcd, RDS)"
  }

  # Regla de salida: Permitir todo el tráfico saliente
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = var.default_egress_allowed_cidrs
  }

  tags = {
    Proyecto = "Kuro-Custom"
    Entorno  = "Laboratorio"
  }
}