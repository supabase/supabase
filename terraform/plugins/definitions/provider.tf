terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 2.16.0"
    }
  }
}

# DO NOT MODIFY ANYTHING ABOVE THIS LINE

variable "USE_PORTAINER" {
  type        = bool
  default     = false
  description = "Set default to true if you want to add portainer to the deployment"
}

variable "USE_WATCHTOWER" {
  type        = bool
  default     = false
  description = "Set default to true if you want to add watchtower to the deployment"
}

variable "USE_NGINX" {
  type        = bool
  default     = false
  description = "Set default to true if you want to add nginx to the deployment"
}
