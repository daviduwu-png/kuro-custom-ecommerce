resource "aws_vpc" "kuro_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name     = "kuro-custom-vpc"
    Proyecto = "Kuro-Custom"
  }
}

# Internet Gateway — permite salida/entrada a internet desde las subnets públicas
resource "aws_internet_gateway" "kuro_igw" {
  vpc_id = aws_vpc.kuro_vpc.id

  tags = {
    Name     = "kuro-custom-igw"
    Proyecto = "Kuro-Custom"
  }
}

# Subnet pública A (us-east-1a) — Control Plane K8s
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.kuro_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name                                = "kuro-public-subnet-a"
    Proyecto                            = "Kuro-Custom"
    "kubernetes.io/cluster/kuro-custom" = "owned"
    "kubernetes.io/role/elb"            = "1"
  }
}

# Subnet pública B (us-east-1b) — Worker Node + 2ª AZ para el ALB
# El ALB de AWS requiere mínimo 2 subnets en AZs distintas.
resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.kuro_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true

  tags = {
    Name                                = "kuro-public-subnet-b"
    Proyecto                            = "Kuro-Custom"
    "kubernetes.io/cluster/kuro-custom" = "owned"
    "kubernetes.io/role/elb"            = "1"
  }
}

# Route Table pública — ruta default hacia Internet Gateway
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.kuro_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.kuro_igw.id
  }

  tags = {
    Name     = "kuro-public-rt"
    Proyecto = "Kuro-Custom"
  }
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public_rt.id
}

# Subnets PRIVADAS para RDS — sin ruta al Internet Gateway

# Subnet privada A (us-east-1a) — RDS primary
resource "aws_subnet" "private_a" {
  vpc_id                  = aws_vpc.kuro_vpc.id
  cidr_block              = "10.0.10.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = false   # Sin IP pública — aislada de internet

  tags = {
    Name     = "kuro-private-subnet-a"
    Proyecto = "Kuro-Custom"
    Rol      = "Capa-Datos"
  }
}

# Subnet privada B (us-east-1b) — RDS requiere mínimo 2 AZs
resource "aws_subnet" "private_b" {
  vpc_id                  = aws_vpc.kuro_vpc.id
  cidr_block              = "10.0.11.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = false

  tags = {
    Name     = "kuro-private-subnet-b"
    Proyecto = "Kuro-Custom"
    Rol      = "Capa-Datos"
  }
}

# Route Table privada — sin ruta a Internet Gateway (aislamiento total)
resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.kuro_vpc.id

  # Sin rutas de salida a internet — solo routing interno de la VPC
  tags = {
    Name     = "kuro-private-rt"
    Proyecto = "Kuro-Custom"
  }
}

resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_route_table_association" "private_b" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private_rt.id
}


resource "aws_db_subnet_group" "kuro_db_subnet_group" {
  name       = "kuro-custom-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name     = "kuro-custom-db-subnet-group"
    Proyecto = "Kuro-Custom"
    Rol      = "Capa-Datos"
  }
}
