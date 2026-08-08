resource "aws_instance" "kuro_control_plane" {
  ami           = "ami-04b70fa74e45c3917"
  instance_type = "c7i-flex.large"
  subnet_id     = aws_subnet.public_a.id # us-east-1a

  key_name = var.ec2_key_name

  vpc_security_group_ids = [aws_security_group.seguridad_kuro.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name                                = "kuro-control-plane-01"
    Proyecto                            = "Kuro-Custom"
    Rol                                 = "Control_Plane"
    "kubernetes.io/cluster/kuro-custom" = "owned"
  }
}

resource "aws_instance" "kuro_worker" {
  ami           = "ami-04b70fa74e45c3917"
  instance_type = "m7i-flex.large"
  subnet_id     = aws_subnet.public_b.id # us-east-1b

  key_name = var.ec2_key_name

  vpc_security_group_ids = [aws_security_group.seguridad_kuro.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name                                = "kuro-app-node-01"
    Proyecto                            = "Kuro-Custom"
    Rol                                 = "Worker_Node"
    "kubernetes.io/cluster/kuro-custom" = "owned"
  }
}

resource "aws_instance" "kuro_worker_2" {
  ami           = "ami-04b70fa74e45c3917"
  instance_type = "m7i-flex.large"
  subnet_id     = aws_subnet.public_a.id # us-east-1a — AZ distinta al worker 1 (us-east-1b) para Alta Disponibilidad Multi-AZ

  key_name = var.ec2_key_name

  vpc_security_group_ids = [aws_security_group.seguridad_kuro.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name                                = "kuro-app-node-02"
    Proyecto                            = "Kuro-Custom"
    Rol                                 = "Worker_Node"
    "kubernetes.io/cluster/kuro-custom" = "owned"
  }
}