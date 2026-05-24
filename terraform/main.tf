terraform {
  # Backend remoto en S3 — permite que GitHub Actions y maquina local compartan el mismo estado.
  backend "s3" {
    bucket         = "kuro-custom-tfstate"
    key            = "kuro-custom/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "kuro-custom-tfstate-lock"
  }
}

provider "aws" {
  region = "us-east-1"
}