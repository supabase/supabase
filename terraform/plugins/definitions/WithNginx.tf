variable "BASE_DOMAIN" {
  type        = string
  default     = "example.com"
  description = "Used for SSL. This would be the domain of your site - e.g. example.com"
}

variable "SUPABASE_SUBDOMAIN" {
  type        = string
  default     = "data"
  description = "Used for SSL. This would be the subdomain of your site where you want to access the supabase stack - e.g. For data.example.com, this value would be 'data'"
}

variable "DOMAIN_CERT_PREFIX" {
  type        = string
  default     = "cloudflare."
  description = "Used for SSL. This is the prefix applied to the filename of SSL certs and keys - e.g. cloudflare.example.com.key.pem would be 'cloudflare.' "
}

variable "NGINX_USE_SSL" {
  type        = bool
  default     = false
  description = "Used for SSL. Determines whether SSL is enabled for Nginx or not. You should also set all variables above to valid values if this is set to true"
}

resource "docker_image" "nginx" {
  name         = "nginx:latest"
  keep_locally = true
  count        = var.USE_NGINX ? 1 : 0
}

resource "docker_container" "nginx" {
  image   = "nginx:latest"
  name    = "nginx"
  count   = var.USE_NGINX ? 1 : 0
  restart = "always"
  command = [
    "nginx",
    "-g",
    "daemon off;"
  ]
  ports {
    internal = 80
    external = 80
  }
  ports {
    internal = 443
    external = 443
  }

  networks_advanced {
    name    = "supabase-network"
    aliases = ["nginx"]
  }

  upload {
    source = "${path.module}/volumes/nginxconfig/nginx.conf"
    file   = "/etc/nginx/nginx.conf"
  }

  upload {
    content = templatefile(abspath("${path.module}/volumes/nginxconfig/conf.d/default.conf.tpl"), {
      BASE_DOMAIN        = var.BASE_DOMAIN
      SUPABASE_SUBDOMAIN = var.SUPABASE_SUBDOMAIN
      DOMAIN_CERT_PREFIX = var.DOMAIN_CERT_PREFIX
      KONG_URL           = "kong"
      KONG_PORT          = "8000"
      NGINX_USE_SSL      = var.NGINX_USE_SSL
    })
    file = "/etc/nginx/conf.d/default.conf"
  }

  upload {
    content = fileexists("${path.module}/volumes/nginxconfig/ssl/${var.DOMAIN_CERT_PREFIX}${var.BASE_DOMAIN}.cert.pem") ? file("${path.module}/volumes/nginxconfig/ssl/${var.DOMAIN_CERT_PREFIX}${var.BASE_DOMAIN}.cert.pem") : ""
    file    = "/etc/nginx/ssl/${var.DOMAIN_CERT_PREFIX}${var.BASE_DOMAIN}.cert.pem"
  }

  upload {
    content = fileexists("${path.module}/volumes/nginxconfig/ssl/${var.DOMAIN_CERT_PREFIX}${var.BASE_DOMAIN}.key.pem") ? file("${path.module}/volumes/nginxconfig/ssl/${var.DOMAIN_CERT_PREFIX}${var.BASE_DOMAIN}.key.pem") : ""
    file    = "/etc/nginx/ssl/${var.DOMAIN_CERT_PREFIX}${var.BASE_DOMAIN}.key.pem"
  }
}
