# Security Group para el ALB
resource "aws_security_group" "alb_sg" {
  name        = "kuro_alb_sg"
  description = "Security Group para el Application Load Balancer"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP desde cualquier lugar"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS desde cualquier lugar"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
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
  subnets            = data.aws_subnets.default.ids

  tags = {
    Proyecto = "Kuro-Custom"
    Rol      = "LoadBalancer"
  }
}

# Target Group para Frontend (Puerto 80)
resource "aws_lb_target_group" "frontend_tg" {
  name     = "kuro-frontend-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    path                = "/"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

# Target Group para Backend (Puerto 8000)
resource "aws_lb_target_group" "backend_tg" {
  name     = "kuro-backend-tg"
  port     = 8000
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    path                = "/api/"
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
  ssl_policy        = "ELBSecurityPolicy-2016-08"
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

# Adjuntar Instancias a los Target Groups
resource "aws_lb_target_group_attachment" "frontend_control_plane" {
  target_group_arn = aws_lb_target_group.frontend_tg.arn
  target_id        = aws_instance.kuro_control_plane.id
  port             = 80
}

resource "aws_lb_target_group_attachment" "frontend_worker" {
  target_group_arn = aws_lb_target_group.frontend_tg.arn
  target_id        = aws_instance.kuro_worker.id
  port             = 80
}

resource "aws_lb_target_group_attachment" "backend_control_plane" {
  target_group_arn = aws_lb_target_group.backend_tg.arn
  target_id        = aws_instance.kuro_control_plane.id
  port             = 8000
}

resource "aws_lb_target_group_attachment" "backend_worker" {
  target_group_arn = aws_lb_target_group.backend_tg.arn
  target_id        = aws_instance.kuro_worker.id
  port             = 8000
}
