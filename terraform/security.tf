# =============================================================================
# Security Group — Worker Nodes
# Recibe tráfico NodePort desde el ALB. NO se asigna al Control Plane.
# =============================================================================
resource "aws_security_group" "seguridad_kuro" {
  name        = "sg_kuro_custom"
  description = "Security Group para los nodos Worker de Kubernetes"
  vpc_id      = aws_vpc.kuro_vpc.id

  # SSH restringido a la IP del operador
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
    description = "SSH solo desde IP autorizada del operador"
  }

  # NodePorts — solo accesibles desde el ALB (el internet llega via ALB, no directo)
  ingress {
    from_port       = 30000
    to_port         = 32767
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
    description     = "NodePorts K8s — trafico entrante solo desde el ALB"
  }

  # Tráfico interno entre workers (K8s inter-node, Calico CNI VXLAN/BGP, kube-proxy)
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
    description = "Trafico interno irrestricto entre workers del cluster"
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
    Rol      = "Worker-Node"
  }
}

# =============================================================================
# Security Group — Control Plane
# SG dedicado: NO tiene regla de NodePort desde el ALB.
# El API Server (6443) es accesible solo desde la VPC (workers + kubectl).
# =============================================================================
resource "aws_security_group" "control_plane_sg" {
  name        = "sg_kuro_control_plane"
  description = "Security Group dedicado al nodo Control Plane de Kubernetes"
  vpc_id      = aws_vpc.kuro_vpc.id

  # SSH restringido a la IP del operador
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
    description = "SSH solo desde IP autorizada del operador"
  }

  # Kubernetes API Server — accesible desde workers y kubectl dentro de la VPC
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "Kubernetes API Server — workers + kubectl desde dentro de la VPC"
  }

  # Tráfico interno entre replicas del Control Plane (útil si se escala a multi-master)
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
    description = "Trafico interno entre nodos Control Plane (etcd, componentes K8s)"
  }

  # Egress irrestricto (pull de imágenes, paquetes APT, llamadas a AWS APIs)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = var.default_egress_allowed_cidrs
  }

  tags = {
    Proyecto = "Kuro-Custom"
    Entorno  = "Laboratorio"
    Rol      = "Control-Plane"
  }
}

# =============================================================================
# Reglas de cross-referencia entre SGs (usando aws_security_group_rule para
# evitar dependencia circular entre los dos recursos de Security Group).
# =============================================================================

# Workers - Control Plane: kubelet healthchecks, Calico BGP/VXLAN, join
resource "aws_security_group_rule" "workers_to_cp" {
  type                     = "ingress"
  from_port                = 0
  to_port                  = 0
  protocol                 = "-1"
  source_security_group_id = aws_security_group.seguridad_kuro.id
  security_group_id        = aws_security_group.control_plane_sg.id
  description              = "Trafico inter-nodo: workers → control plane (kubelet, CNI, kubeadm join)"
}

# Control Plane - Workers: API server → kubelet (logs, exec, port-forward, metrics)
resource "aws_security_group_rule" "cp_to_workers" {
  type                     = "ingress"
  from_port                = 0
  to_port                  = 0
  protocol                 = "-1"
  source_security_group_id = aws_security_group.control_plane_sg.id
  security_group_id        = aws_security_group.seguridad_kuro.id
  description              = "Trafico inter-nodo: control plane → workers (kubelet API, logs, exec)"
}