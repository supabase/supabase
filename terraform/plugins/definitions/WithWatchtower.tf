resource "docker_volume" "watchtower_config" {
  name  = "watchtower-config"
  count = var.USE_WATCHTOWER ? 1 : 0
}

resource "docker_image" "watchtower" {
  name         = "containrrr/watchtower:latest"
  keep_locally = true
  count        = var.USE_WATCHTOWER ? 1 : 0
}

resource "docker_container" "watchtower" {
  count = var.USE_WATCHTOWER ? 1 : 0
  image = "containrrr/watchtower:latest"
  name  = "watchtower"
  ports {
    internal = 8080
    external = 8091
  }

  mounts {
    source    = "/var/run/docker.sock"
    target    = "/var/run/docker.sock"
    type      = "bind"
    read_only = true
  }

  mounts {
    source = docker_volume.watchtower_config[0].name
    target = "/config"
    type   = "volume"
  }

  upload {
    content = templatefile(abspath("${path.module}/volumes/watchtower/config.json.tpl"), {
      GHCR_IO_TOKEN = var.GHCR_IO_TOKEN,
    })
    file = "/config/config.json"
  }

  env = [
    "WATCHTOWER_CLEANUP=true",
    "WATCHTOWER_DEBUG=true",
    "WATCHTOWER_INCLUDE_STOPPED=true",
    "DOCKER_CONFIG=/config",
    "HTTP-API-UPDATE=true",
    "WATCHTOWER_HTTP_API_TOKEN=${random_password.WATCHTOWER_HTTP_API_TOKEN.result}",
  ]
}
