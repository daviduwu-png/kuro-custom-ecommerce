resource "aws_db_instance" "kuro_postgres" {
  identifier             = "kuro-custom-db-instance" 
  
  allocated_storage      = 20
  engine                 = "postgres"
  engine_version         = "16.3"
  instance_class         = "db.t3.micro"
  db_name                = "kurodb" 
  username               = var.db_user
  password               = var.db_password
  parameter_group_name   = "default.postgres16"
  skip_final_snapshot    = true
  publicly_accessible    = false
  
  vpc_security_group_ids = [aws_security_group.seguridad_kuro.id]

  tags = {
    Proyecto = "Kuro-Custom"
    Rol      = "Capa-Datos"
  }
}