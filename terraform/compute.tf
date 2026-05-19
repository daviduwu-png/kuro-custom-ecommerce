resource "aws_instance" "kuro_control_plane" {
  ami           = "ami-04b70fa74e45c3917"
  instance_type = "m7i-flex.large"

  key_name = var.ec2_key_name

  vpc_security_group_ids = [aws_security_group.seguridad_kuro.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name                                  = "kuro-control-plane-01"
    Proyecto                              = "Kuro-Custom"
    Rol                                   = "Control_Plane"
    "kubernetes.io/cluster/kuro-custom"   = "owned"
  }
}

resource "aws_instance" "kuro_worker" {
  ami           = "ami-04b70fa74e45c3917"
  instance_type = "m7i-flex.large"

  key_name = var.ec2_key_name

  vpc_security_group_ids = [aws_security_group.seguridad_kuro.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name                                  = "kuro-app-node-01"
    Proyecto                              = "Kuro-Custom"
    Rol                                   = "Worker_Node"
    "kubernetes.io/cluster/kuro-custom"   = "owned"
  }
}