module "generate_jwt_anon_key" {
  source  = "github.com/matti/terraform-shell-resource"
  command = "docker run --rm ghcr.io/chronsyn/docker-jwt-generator:master -e --role=\"anon\" --secret=\"'${random_password.JWT_SECRET.result}'\" --issuer=\"supabase\""
}

module "generate_jwt_service_role_key" {
  source  = "github.com/matti/terraform-shell-resource"
  command = "docker run --rm ghcr.io/chronsyn/docker-jwt-generator:master -e --role=\"service_role\" --secret=\"'${random_password.JWT_SECRET.result}'\" --issuer=\"supabase\""
}

resource "docker_volume" "pg_data" {
  name = "pg_data"
  lifecycle {
    prevent_destroy       = false
    create_before_destroy = true
  }
}

resource "docker_volume" "pg_init" {
  name = "pg_init"
}

resource "docker_volume" "pg_config" {
  name = "pg_config"
  lifecycle {
    prevent_destroy       = false
    create_before_destroy = true
  }
}

resource "docker_volume" "kong_data" {
  name = "kong_data"
}

resource "docker_volume" "storage_data" {
  name  = "storage_data"
  count = var.ENABLE_STORAGE ? 1 : 0
  lifecycle {
    prevent_destroy       = false
    create_before_destroy = true
  }
}

resource "docker_network" "supabase-network" {
  name = "supabase-network"
}

resource "docker_container" "supabase-postgres" {
  image = docker_image.supabase-postgres.name
  name  = var.POSTGRES_HOST
  ports {
    internal = var.POSTGRES_PORT
    external = var.POSTGRES_PORT
  }
  networks_advanced {
    name    = "supabase-network"
    aliases = ["db"]
  }
  env = [
    "POSTGRES_PASSWORD=${random_password.POSTGRES_PASSWORD.result}",
    "PGDATA=/var/lib/postgresql/data"
  ]
  command = ["postgres", "-c", "config-file=/etc/postgresql/postgresql.conf"]
  restart = "unless-stopped"

  mounts {
    source = docker_volume.pg_data.name
    target = "/var/lib/postgresql/data"
    type   = "volume"
  }

  # remove_volumes = false

  mounts {
    source = docker_volume.pg_config.name
    target = "/etc/postgresql"
    type   = "volume"
  }

  # The file located at volumes/db/config/postgresql.conf will be uploaded into the 'pg_config' volume
  # You can customise this file and then run 'terraform apply' to apply the updated config
  upload {
    source = "${path.module}/volumes/db/config/postgresql.conf"
    file   = "/etc/postgresql/postgresql.conf"
  }

  # Create a place to upload our initialisation scripts
  # These will be run after the container is started
  mounts {
    source = docker_volume.pg_init.name
    target = "/home/init"
    type   = "volume"
  }

  # Upload our init scripts
  upload {
    content = file("${path.module}/volumes/db/init/sql/00-initial-schema.sql")
    file    = "/home/init/00-initial-schema.sql"
  }

  upload {
    content = file("${path.module}/volumes/db/init/sql/01-auth-schema.sql")
    file    = "/home/init/01-auth-schema.sql"
  }

  upload {
    content = file("${path.module}/volumes/db/init/sql/02-storage-schema.sql")
    file    = "/home/init/02-storage-schema.sql"
  }

  upload {
    content = file("${path.module}/volumes/db/init/sql/03-post-setup.sql")
    file    = "/home/init/03-post-setup.sql"
  }
}

resource "docker_container" "supabase-studio" {
  image = docker_image.supabase-studio.name
  name  = "supabase-studio"
  depends_on = [
    docker_container.supabase-postgres
  ]
  ports {
    internal = 3000
    external = 2500
  }
  networks_advanced {
    name    = "supabase-network"
    aliases = ["studio"]
  }
  env = [
    # You should not change this as Nginx plugin relies on the service being accessible at this location
    "SUPABASE_URL=http://kong:8000",
    "STUDIO_PG_META_URL=http://${var.META_URL}:${var.META_PORT}",
  ]
}

resource "docker_container" "supabase-kong" {
  image = docker_image.supabase-kong.name
  name  = "supabase-kong"

  networks_advanced {
    name    = "supabase-network"
    aliases = ["kong"]
  }
  ports {
    internal = 8000
    external = 8000
  }
  ports {
    internal = 8443
    external = 8443
  }
  restart = "unless-stopped"
  env = [
    "KONG_DATABASE=off",
    "KONG_DECLARATIVE_CONFIG=/var/lib/kong/kong.yml",
    "KONG_DNS_ORDER=LAST,A,CNAME",
    "KONG_PLUGINS=request-transformer,cors,key-auth,acl"
  ]

  upload {
    content = templatefile(abspath("${path.module}/volumes/api/kong.tpl"), {
      ANON_KEY   = module.generate_jwt_anon_key.stdout,
      SECRET_KEY = module.generate_jwt_service_role_key.stdout,
      META_URL   = var.META_URL,
      META_PORT  = var.META_PORT,
    })
    file = "/var/lib/kong/kong.yml"
  }

  mounts {
    source = docker_volume.kong_data.name
    target = "/var/lib/kong"
    type   = "volume"
  }
}

resource "docker_container" "pg-meta" {
  image = docker_image.pg-meta.name
  name  = "pg-meta"
  depends_on = [
    docker_container.supabase-postgres
  ]
  ports {
    internal = 8080
    external = 8080
  }
  networks_advanced {
    name    = "supabase-network"
    aliases = ["meta"]
  }
  env = [
    "PG_META_PORT=${var.META_PORT}",
    "PG_META_DB_HOST=${var.POSTGRES_HOST}",
    "PG_META_DB_PASSWORD=${random_password.POSTGRES_PASSWORD.result}",
  ]
}

resource "docker_container" "supabase-realtime" {
  image = docker_image.supabase-realtime.name
  name  = "supabase-realtime"
  depends_on = [
    docker_container.supabase-postgres,
    null_resource.db_setup_03
  ]
  ports {
    internal = 4000
    external = 4000
  }
  networks_advanced {
    name    = "supabase-network"
    aliases = ["realtime"]
  }
  env = [
    "DB_HOST=${var.POSTGRES_HOST}",
    "DB_PORT=${var.POSTGRES_PORT}",
    "DB_NAME=${var.POSTGRES_DB}",
    "DB_USER=${var.POSTGRES_USER}",
    "DB_PASSWORD=${random_password.POSTGRES_PASSWORD.result}",
    "DB_SSL=false",
    "PORT=4000",
    "JWT_SECRET=${random_password.JWT_SECRET.result}",
    "REPLICATION_MODE=RLS",
    "REPLICATION_POLL_INTERVAL=300",
    "SECURE_CHANNELS=true",
    "SLOT_NAME=supabase_realtime_rls",
    "TEMPORARY_SLOT=true",
  ]


  restart = "unless-stopped"
  command = [
    "bash",
    "-c",
    "./prod/rel/realtime/bin/realtime eval Realtime.Release.migrate && ./prod/rel/realtime/bin/realtime start"
  ]
}

resource "docker_container" "supabase-storage" {
  image = docker_image.supabase-storage[0].name
  name  = "supabase-storage"
  count = var.ENABLE_STORAGE ? 1 : 0
  depends_on = [
    docker_container.supabase-postgres,
    docker_container.supabase-rest,
    null_resource.db_setup_03
  ]
  ports {
    internal = 5000
    external = 5000
  }
  networks_advanced {
    name    = "supabase-network"
    aliases = ["storage"]
  }
  mounts {
    source = docker_volume.storage_data[0].name
    target = "/var/lib/storage"
    type   = "volume"
  }
  env = [
    "ANON_KEY=${module.generate_jwt_anon_key.stdout}",
    "SERVICE_KEY=${module.generate_jwt_service_role_key.stdout}",
    "POSTGREST_URL=http://rest:3000",
    "PGRST_JWT_SECRET=${random_password.JWT_SECRET.result}",
    "DATABASE_URL=postgres://${var.POSTGRES_USER}:${random_password.POSTGRES_PASSWORD.result}@${var.POSTGRES_HOST}:${var.POSTGRES_PORT}/postgres",
    "PGOPTIONS=-c search_path=storage,public",
    "FILE_SIZE_LIMIT=52428800", // Value in bytes
    "STORAGE_BACKEND=file",
    "FILE_STORAGE_BACKEND_PATH=/var/lib/storage",
    "TENANT_ID=stub",
    "REGION=stub",
    "GLOBAL_S3_BUCKET=stub",
  ]
}

resource "docker_container" "supabase-auth" {
  image = docker_image.supabase-auth.name
  name  = "supabase-auth"
  depends_on = [
    docker_container.supabase-postgres,
    null_resource.db_setup_03
  ]
  restart = "unless-stopped"
  ports {
    internal = 9999
    external = 9999
  }
  networks_advanced {
    name    = "supabase-network"
    aliases = ["auth"]
  }
  env = [
    "GOTRUE_API_HOST=0.0.0.0",
    "GOTRUE_API_PORT=9999",
    "GOTRUE_DB_DRIVER=postgres",
    "GOTRUE_DB_DATABASE_URL=postgres://${var.POSTGRES_USER}:${random_password.POSTGRES_PASSWORD.result}@${var.POSTGRES_HOST}:${var.POSTGRES_PORT}/${var.POSTGRES_DB}?search_path=auth",
    "GOTRUE_SITE_URL=${var.SITE_URL}",
    "GOTRUE_URI_ALLOW_LIST=${var.ADDITIONAL_REDIRECT_URLS}",
    "GOTRUE_DISABLE_SIGNUP=${var.DISABLE_SIGNUP}",
    "GOTRUE_JWT_SECRET=${random_password.JWT_SECRET.result}",
    "GOTRUE_JWT_EXPIRY=${var.JWT_EXPIRY}",
    "GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated",
    "GOTRUE_EXTERNAL_EMAIL_ENABLED=${var.ENABLE_EMAIL_SIGNUP}",
    "GOTRUE_MAILER_AUTOCONFIRM=${var.ENABLE_EMAIL_AUTOCONFIRM}",
    "API_EXTERNAL_URL=${var.API_EXTERNAL_URL}",
    "GOTRUE_MAILER_TEMPLATES_INVITE=${var.EMAIL_INVITE_TEMPLATE_URL}",
    "GOTRUE_MAILER_TEMPLATES_CONFIRMATION=${var.EMAIL_CONFIRMATION_TEMPLATE_URL}",
    "GOTRUE_MAILER_TEMPLATES_RECOVERY=${var.EMAIL_RECOVERY_TEMPLATE_URL}",
    "GOTRUE_MAILER_TEMPLATES_MAGIC_LINK=${var.EMAIL_MAGICLINK_TEMPLATE_URL}",
    "GOTRUE_SMTP_HOST=${var.SMTP_HOST}",
    "GOTRUE_SMTP_PORT=${var.SMTP_PORT}",
    "GOTRUE_SMTP_USER=${var.SMTP_USER}",
    "GOTRUE_SMTP_PASSWORD=${var.SMTP_PASS}",
    "GOTRUE_SMTP_ADMIN_EMAIL=${var.SMTP_ADMIN_EMAIL}",
    "GOTRUE_MAILER_URLPATHS_INVITE=/auth/v1/verify",
    "GOTRUE_MAILER_URLPATHS_CONFIRMATION=/auth/v1/verify",
    "GOTRUE_MAILER_URLPATHS_RECOVERY=/auth/v1/verify",
    "GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE=/auth/v1/verify",
    "GOTRUE_EXTERNAL_PHONE_ENABLED=${var.ENABLE_PHONE_SIGNUP}",
    "GOTRUE_SMS_AUTOCONFIRM=${var.ENABLE_PHONE_AUTOCONFIRM}",
    # 
    # 
    # THIRD PARTY AUTH
    # 
    # 
    # APPLE AUTH VARS
    "GOTRUE_EXTERNAL_APPLE_ENABLED=${var.THIRD_PARTY_AUTH_APPLE_ENABLED}",
    "GOTRUE_EXTERNAL_APPLE_CLIENT_ID=${var.THIRD_PARTY_AUTH_APPLE_CLIENT_ID}",
    "GOTRUE_EXTERNAL_APPLE_SECRET=${var.THIRD_PARTY_AUTH_APPLE_SECRET}",
    "GOTRUE_EXTERNAL_APPLE_REDIRECT_URI=${var.THIRD_PARTY_AUTH_APPLE_REDIRECT_URI}",
    # AZURE AUTH VARS
    "GOTRUE_EXTERNAL_AZURE_ENABLED=${var.THIRD_PARTY_AUTH_AZURE_ENABLED}",
    "GOTRUE_EXTERNAL_AZURE_CLIENT_ID=${var.THIRD_PARTY_AUTH_AZURE_CLIENT_ID}",
    "GOTRUE_EXTERNAL_AZURE_SECRET=${var.THIRD_PARTY_AUTH_AZURE_SECRET}",
    "GOTRUE_EXTERNAL_AZURE_REDIRECT_URI=${var.THIRD_PARTY_AUTH_AZURE_REDIRECT_URI}",
    # BITBUCKET AUTH VARS
    "GOTRUE_EXTERNAL_BITBUCKET_ENABLED=${var.THIRD_PARTY_AUTH_BITBUCKET_ENABLED}",
    "GOTRUE_EXTERNAL_BITBUCKET_CLIENT_ID=${var.THIRD_PARTY_AUTH_BITBUCKET_CLIENT_ID}",
    "GOTRUE_EXTERNAL_BITBUCKET_SECRET=${var.THIRD_PARTY_AUTH_BITBUCKET_SECRET}",
    "GOTRUE_EXTERNAL_BITBUCKET_REDIRECT_URI=${var.THIRD_PARTY_AUTH_BITBUCKET_REDIRECT_URI}",
    # DISCORD AUTH VARS
    "GOTRUE_EXTERNAL_DISCORD_ENABLED=${var.THIRD_PARTY_AUTH_DISCORD_ENABLED}",
    "GOTRUE_EXTERNAL_DISCORD_CLIENT_ID=${var.THIRD_PARTY_AUTH_DISCORD_CLIENT_ID}",
    "GOTRUE_EXTERNAL_DISCORD_SECRET=${var.THIRD_PARTY_AUTH_DISCORD_SECRET}",
    "GOTRUE_EXTERNAL_DISCORD_REDIRECT_URI=${var.THIRD_PARTY_AUTH_DISCORD_REDIRECT_URI}",
    # FACEBOOK AUTH VARS
    "GOTRUE_EXTERNAL_FACEBOOK_ENABLED=${var.THIRD_PARTY_AUTH_FACEBOOK_ENABLED}",
    "GOTRUE_EXTERNAL_FACEBOOK_CLIENT_ID=${var.THIRD_PARTY_AUTH_FACEBOOK_CLIENT_ID}",
    "GOTRUE_EXTERNAL_FACEBOOK_SECRET=${var.THIRD_PARTY_AUTH_FACEBOOK_SECRET}",
    "GOTRUE_EXTERNAL_FACEBOOK_REDIRECT_URI=${var.THIRD_PARTY_AUTH_FACEBOOK_REDIRECT_URI}",
    # GITHUB AUTH VARS
    "GOTRUE_EXTERNAL_GITHUB_ENABLED=${var.THIRD_PARTY_AUTH_GITHUB_ENABLED}",
    "GOTRUE_EXTERNAL_GITHUB_CLIENT_ID=${var.THIRD_PARTY_AUTH_GITHUB_CLIENT_ID}",
    "GOTRUE_EXTERNAL_GITHUB_SECRET=${var.THIRD_PARTY_AUTH_GITHUB_SECRET}",
    "GOTRUE_EXTERNAL_GITHUB_REDIRECT_URI=${var.THIRD_PARTY_AUTH_GITHUB_REDIRECT_URI}",
    # GITLAB AUTH VARS
    "GOTRUE_EXTERNAL_GITLAB_ENABLED=${var.THIRD_PARTY_AUTH_GITLAB_ENABLED}",
    "GOTRUE_EXTERNAL_GITLAB_CLIENT_ID=${var.THIRD_PARTY_AUTH_GITLAB_CLIENT_ID}",
    "GOTRUE_EXTERNAL_GITLAB_SECRET=${var.THIRD_PARTY_AUTH_GITLAB_SECRET}",
    "GOTRUE_EXTERNAL_GITLAB_REDIRECT_URI=${var.THIRD_PARTY_AUTH_GITLAB_REDIRECT_URI}",
    # GOOGLE AUTH VARS
    "GOTRUE_EXTERNAL_GOOGLE_ENABLED=${var.THIRD_PARTY_AUTH_GOOGLE_ENABLED}",
    "GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=${var.THIRD_PARTY_AUTH_GOOGLE_CLIENT_ID}",
    "GOTRUE_EXTERNAL_GOOGLE_SECRET=${var.THIRD_PARTY_AUTH_GOOGLE_SECRET}",
    "GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=${var.THIRD_PARTY_AUTH_GOOGLE_REDIRECT_URI}",
    # LINKEDIN AUTH VARS
    "GOTRUE_EXTERNAL_LINKEDIN_ENABLED=${var.THIRD_PARTY_AUTH_LINKEDIN_ENABLED}",
    "GOTRUE_EXTERNAL_LINKEDIN_CLIENT_ID=${var.THIRD_PARTY_AUTH_LINKEDIN_CLIENT_ID}",
    "GOTRUE_EXTERNAL_LINKEDIN_SECRET=${var.THIRD_PARTY_AUTH_LINKEDIN_SECRET}",
    "GOTRUE_EXTERNAL_LINKEDIN_REDIRECT_URI=${var.THIRD_PARTY_AUTH_LINKEDIN_REDIRECT_URI}",
    # NOTION AUTH VARS
    "GOTRUE_EXTERNAL_NOTION_ENABLED=${var.THIRD_PARTY_AUTH_NOTION_ENABLED}",
    "GOTRUE_EXTERNAL_NOTION_CLIENT_ID=${var.THIRD_PARTY_AUTH_NOTION_CLIENT_ID}",
    "GOTRUE_EXTERNAL_NOTION_SECRET=${var.THIRD_PARTY_AUTH_NOTION_SECRET}",
    "GOTRUE_EXTERNAL_NOTION_REDIRECT_URI=${var.THIRD_PARTY_AUTH_NOTION_REDIRECT_URI}",
    # SPOTIFY AUTH VARS
    "GOTRUE_EXTERNAL_SPOTIFY_ENABLED=${var.THIRD_PARTY_AUTH_SPOTIFY_ENABLED}",
    "GOTRUE_EXTERNAL_SPOTIFY_CLIENT_ID=${var.THIRD_PARTY_AUTH_SPOTIFY_CLIENT_ID}",
    "GOTRUE_EXTERNAL_SPOTIFY_SECRET=${var.THIRD_PARTY_AUTH_SPOTIFY_SECRET}",
    "GOTRUE_EXTERNAL_SPOTIFY_REDIRECT_URI=${var.THIRD_PARTY_AUTH_SPOTIFY_REDIRECT_URI}",
    # SLACK AUTH VARS
    "GOTRUE_EXTERNAL_SLACK_ENABLED=${var.THIRD_PARTY_AUTH_SLACK_ENABLED}",
    "GOTRUE_EXTERNAL_SLACK_CLIENT_ID=${var.THIRD_PARTY_AUTH_SLACK_CLIENT_ID}",
    "GOTRUE_EXTERNAL_SLACK_SECRET=${var.THIRD_PARTY_AUTH_SLACK_SECRET}",
    "GOTRUE_EXTERNAL_SLACK_REDIRECT_URI=${var.THIRD_PARTY_AUTH_SLACK_REDIRECT_URI}",
    # TWITCH AUTH VARS
    "GOTRUE_EXTERNAL_TWITCH_ENABLED=${var.THIRD_PARTY_AUTH_TWITCH_ENABLED}",
    "GOTRUE_EXTERNAL_TWITCH_CLIENT_ID=${var.THIRD_PARTY_AUTH_TWITCH_CLIENT_ID}",
    "GOTRUE_EXTERNAL_TWITCH_SECRET=${var.THIRD_PARTY_AUTH_TWITCH_SECRET}",
    "GOTRUE_EXTERNAL_TWITCH_REDIRECT_URI=${var.THIRD_PARTY_AUTH_TWITCH_REDIRECT_URI}",
    # TWITTER AUTH VARS
    "GOTRUE_EXTERNAL_TWITTER_ENABLED=${var.THIRD_PARTY_AUTH_TWITTER_ENABLED}",
    "GOTRUE_EXTERNAL_TWITTER_CLIENT_ID=${var.THIRD_PARTY_AUTH_TWITTER_CLIENT_ID}",
    "GOTRUE_EXTERNAL_TWITTER_SECRET=${var.THIRD_PARTY_AUTH_TWITTER_SECRET}",
    "GOTRUE_EXTERNAL_TWITTER_REDIRECT_URI=${var.THIRD_PARTY_AUTH_TWITTER_REDIRECT_URI}"
  ]

  command = ["gotrue"]
}

resource "docker_container" "supabase-rest" {
  image = docker_image.supabase-rest.name
  name  = "supabase-rest"
  depends_on = [
    docker_container.supabase-postgres
  ]
  ports {
    internal = 3000
    external = 3000
  }
  networks_advanced {
    name    = "supabase-network"
    aliases = ["rest"]
  }
  env = [
    "PGRST_DB_URI=postgres://${var.POSTGRES_USER}:${random_password.POSTGRES_PASSWORD.result}@${var.POSTGRES_HOST}:${var.POSTGRES_PORT}/${var.POSTGRES_DB}",
    "PGRST_DB_SCHEMAS=public,storage",
    "PGRST_DB_ANON_ROLE=anon",
    "PGRST_JWT_SECRET=${random_password.JWT_SECRET.result}",
    "PGRST_DB_USE_LEGACY_GUCS=false"
  ]
  command = ["/bin/postgrest"]
  restart = "unless-stopped"
}
