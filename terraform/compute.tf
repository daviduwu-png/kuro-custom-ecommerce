resource "aws_instance" "kuro_worker" {
  ami           = "ami-04b70fa74e45c3917"
  instance_type = "t3.micro"
  
 
  vpc_security_group_ids = [aws_security_group.seguridad_kuro.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name     = "kuro-app-node-01"
    Proyecto = "Kuro-Custom"
    Rol      = "Worker-Node"
  }
}