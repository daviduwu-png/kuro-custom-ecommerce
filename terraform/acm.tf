resource "aws_acm_certificate" "kuro_cert" {
  domain_name               = "kurocustom.uk"
  subject_alternative_names = ["www.kurocustom.uk"]
  validation_method         = "DNS"

  tags = {
    Proyecto = "Kuro-Custom"
    Rol      = "Seguridad"
  }

  lifecycle {
    create_before_destroy = true
  }
}

output "acm_validation_records" {
  description = "Registros DNS necesarios para validar el certificado SSL en Cloudflare"
  value = {
    for dvo in aws_acm_certificate.kuro_cert.domain_validation_options : dvo.domain_name => {
      Name   = dvo.resource_record_name
      Type   = dvo.resource_record_type
      Target = dvo.resource_record_value
    }
  }
}
