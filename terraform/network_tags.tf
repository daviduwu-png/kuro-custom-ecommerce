data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_ec2_tag" "subnet_cluster_tag" {
  for_each    = toset(data.aws_subnets.default.ids)
  resource_id = each.value
  key         = "kubernetes.io/cluster/kuro-custom"
  value       = "owned"
}

resource "aws_ec2_tag" "subnet_elb_tag" {
  for_each    = toset(data.aws_subnets.default.ids)
  resource_id = each.value
  key         = "kubernetes.io/role/elb"
  value       = "1"
}
