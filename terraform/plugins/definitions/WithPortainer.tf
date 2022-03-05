resource "docker_image" "portainer" {
  name         = "cr.portainer.io/portainer/portainer-ce:latest"
  keep_locally = true
  count        = var.USE_PORTAINER ? 1 : 0
}

resource "docker_volume" "portainer_data" {
  name  = "portainer-data"
  count = var.USE_PORTAINER ? 1 : 0
}

resource "docker_container" "portainer" {
  image   = "cr.portainer.io/portainer/portainer-ce:latest"
  name    = "portainer"
  count   = var.USE_PORTAINER ? 1 : 0
  restart = "always"
  ports {
    internal = 9000
    external = 9000
  }

  mounts {
    source = docker_volume.portainer_data[0].name
    target = "/data"
    type   = "volume"
  }

  mounts {
    source = "/var/run/docker.sock"
    target = "/var/run/docker.sock"
    type   = "bind"
  }
}
