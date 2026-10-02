# Security Group para el ALB
resource "aws_security_group" "alb_sg" {
  name        = "kuro_alb_sg"
  description = "Security Group para el Application Load Balancer"
  vpc_id      = aws_vpc.kuro_vpc.id

  ingress {
    description = "CIDRs permitidos para HTTP (por defecto publico; restringir a IPs conocidas o CloudFront en produccion)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.alb_allowed_cidrs
  }

  ingress {
    description = "CIDRs permitidos para HTTPS (por defecto publico; restringir a IPs conocidas o CloudFront en produccion)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.alb_allowed_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = var.alb_egress_allowed_cidrs
  }

  tags = {
    Proyecto = "Kuro-Custom"
    Rol      = "LoadBalancer"
  }
}

# El Application Load Balancer
resource "aws_lb" "kuro_alb" {
  name               = "kuro-custom-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  enable_deletion_protection = var.alb_enable_deletion_protection
  idle_timeout               = 60

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "kuro-alb-logs"
    enabled = true
  }

  tags = {
    Proyecto = "Kuro-Custom"
    Rol      = "LoadBalancer"
  }
}

# Target Group para Frontend (NodePort fijo 30080)
resource "aws_lb_target_group" "frontend_tg" {
  name     = "kuro-frontend-tg"
  port     = 30080
  protocol = "HTTP"
  vpc_id   = aws_vpc.kuro_vpc.id

  health_check {
    path                = "/"
    port                = "30080"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
    matcher             = "200-399"
  }
}

# Target Group para Backend (NodePort fijo 30800)
resource "aws_lb_target_group" "backend_tg" {
  name     = "kuro-backend-tg"
  port     = 30800
  protocol = "HTTP"
  vpc_id   = aws_vpc.kuro_vpc.id

  health_check {
    path                = "/api/health/"
    port                = "30800"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
    matcher             = "200-400"
  }
}

# Target Group para Grafana (NodePort fijo 30300)
resource "aws_lb_target_group" "grafana_tg" {
  name     = "kuro-grafana-tg"
  port     = 30300
  protocol = "HTTP"
  vpc_id   = aws_vpc.kuro_vpc.id

  health_check {
    path                = "/api/health"
    port                = "30300"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
    matcher             = "200-399"
  }
}

# Listener del ALB (Puerto 80) -> Redirige a 443
resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.kuro_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# Listener del ALB (Puerto 443) -> Encriptación SSL/TLS
resource "aws_lb_listener" "https_listener" {
  load_balancer_arn = aws_lb.kuro_alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = var.alb_ssl_policy
  certificate_arn   = aws_acm_certificate.kuro_cert.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend_tg.arn
  }
}

# Reglas del Listener para rutear /api, /admin y /static al Backend (Ahora en HTTPS)
resource "aws_lb_listener_rule" "backend_rule" {
  listener_arn = aws_lb_listener.https_listener.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend_tg.arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/api", "/admin/*", "/admin", "/static/*"]
    }
  }
}

# Reglas del Listener para rutear grafana.kurocustom.uk al Target Group de Grafana
resource "aws_lb_listener_rule" "grafana_rule" {
  listener_arn = aws_lb_listener.https_listener.arn
  priority     = 50

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.grafana_tg.arn
  }

  condition {
    host_header {
      values = ["grafana.kurocustom.uk"]
    }
  }
}

# Adjuntar Instancias a los Target Groups (NodePorts fijos)
resource "aws_lb_target_group_attachment" "frontend_worker" {
  target_group_arn = aws_lb_target_group.frontend_tg.arn
  target_id        = aws_instance.kuro_worker.id
  port             = 30080
}

resource "aws_lb_target_group_attachment" "backend_worker" {
  target_group_arn = aws_lb_target_group.backend_tg.arn
  target_id        = aws_instance.kuro_worker.id
  port             = 30800
}

resource "aws_lb_target_group_attachment" "frontend_worker_2" {
  target_group_arn = aws_lb_target_group.frontend_tg.arn
  target_id        = aws_instance.kuro_worker_2.id
  port             = 30080
}

resource "aws_lb_target_group_attachment" "backend_worker_2" {
  target_group_arn = aws_lb_target_group.backend_tg.arn
  target_id        = aws_instance.kuro_worker_2.id
  port             = 30800
}

resource "aws_lb_target_group_attachment" "grafana_worker" {
  target_group_arn = aws_lb_target_group.grafana_tg.arn
  target_id        = aws_instance.kuro_worker.id
  port             = 30300
}

resource "aws_lb_target_group_attachment" "grafana_worker_2" {
  target_group_arn = aws_lb_target_group.grafana_tg.arn
  target_id        = aws_instance.kuro_worker_2.id
  port             = 30300
}



data "aws_caller_identity" "current" {}

resource "random_id" "alb_logs_suffix" {
  byte_length = 4
}

locals {
  alb_logs_bucket_name = var.alb_logs_bucket_name != "" ? var.alb_logs_bucket_name : "kuro-alb-logs-${random_id.alb_logs_suffix.hex}"
}

resource "aws_s3_bucket" "alb_logs" {
  bucket = local.alb_logs_bucket_name

  force_destroy = true

  lifecycle {
    prevent_destroy = false
  }
}



resource "aws_s3_bucket_versioning" "alb_logs_versioning" {
  bucket = aws_s3_bucket.alb_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs_sse" {
  bucket = aws_s3_bucket.alb_logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "alb_logs_public_access" {
  bucket                  = aws_s3_bucket.alb_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "alb_logs_policy" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSLoadBalancerLogsPolicy"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::127311923021:root"
        }
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

