# Registros de validación para ACM SSL (AWS)
resource "cloudflare_record" "acm_validation" {
  for_each = {
    for dvo in aws_acm_certificate.kuro_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = var.cloudflare_zone_id
  name    = each.value.name
  value   = each.value.record
  type    = each.value.type
  proxied = false
  ttl     = 120
}

# CNAME para el dominio principal (App Frontend/Backend)
resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = aws_lb.kuro_alb.dns_name
  type    = "CNAME"
  proxied = false
  ttl     = 120
}

# CNAME para la raíz del dominio (@) usando CNAME flattening en Cloudflare
resource "cloudflare_record" "root" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  value   = aws_lb.kuro_alb.dns_name
  type    = "CNAME"
  proxied = false
  ttl     = 120
}

# CNAME para Grafana
resource "cloudflare_record" "grafana" {
  zone_id = var.cloudflare_zone_id
  name    = "grafana"
  value   = aws_lb.kuro_alb.dns_name
  type    = "CNAME"
  proxied = false
  ttl     = 120
}
