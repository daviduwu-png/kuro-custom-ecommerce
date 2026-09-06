resource "aws_acm_certificate" "kuro_cert" {
  domain_name               = "kurocustom.uk"
  subject_alternative_names = ["www.kurocustom.uk", "grafana.kurocustom.uk"]
  validation_method         = "DNS"

  tags = {
    Proyecto = "Kuro-Custom"
    Rol      = "Seguridad"
  }

  lifecycle {
    create_before_destroy = true
  }
}

