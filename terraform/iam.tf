resource "aws_iam_role" "kuro_ccm" {
  name = "kuro-ccm-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Proyecto = "Kuro-Custom"
    Rol      = "Cloud-Controller-Manager"
  }
}

resource "aws_iam_role_policy" "kuro_ccm" {
  name = "kuro-ccm-policy"
  role = aws_iam_role.kuro_ccm.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "ec2:CreateTags",
          "ec2:DeleteTags",
          "ec2:CreateSecurityGroup",
          "ec2:DeleteSecurityGroup",
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:AuthorizeSecurityGroupEgress",
          "ec2:RevokeSecurityGroupEgress",
          "ec2:CreateRoute",
          "ec2:DeleteRoute",
          "ec2:ReplaceRoute",
          "ec2:ModifyInstanceAttribute",
          "ec2:ModifyNetworkInterfaceAttribute",
          "ec2:AttachNetworkInterface",
          "ec2:DetachNetworkInterface"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = "iam:CreateServiceLinkedRole"
        Resource = "*"
        Condition = {
          StringEquals = {
            "iam:AWSServiceName" = "elasticloadbalancing.amazonaws.com"
          }
        }
      }
    ]
  })
}

resource "aws_iam_instance_profile" "kuro_ccm" {
  name = "kuro-ccm-instance-profile"
  role = aws_iam_role.kuro_ccm.name
}
