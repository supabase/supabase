resource "time_sleep" "sleep_wait" {
  depends_on = [docker_container.supabase-postgres]

  create_duration = "20s"
}

resource "null_resource" "db_setup_00" {
  provisioner "local-exec" {
    command = "docker exec -e PGPASSWORD=${random_password.POSTGRES_PASSWORD.result} -i ${var.POSTGRES_HOST} psql -h ${var.POSTGRES_HOST} -p ${var.POSTGRES_PORT} -U ${var.POSTGRES_USER} -d ${var.POSTGRES_DB} -f \"/home/init/00-initial-schema.sql\""
  }
  depends_on = [
    docker_container.supabase-postgres,
    time_sleep.sleep_wait
  ]
}

resource "null_resource" "db_setup_01" {
  provisioner "local-exec" {
    command = "docker exec -e PGPASSWORD=${random_password.POSTGRES_PASSWORD.result} -i ${var.POSTGRES_HOST} psql -h ${var.POSTGRES_HOST} -p ${var.POSTGRES_PORT} -U ${var.POSTGRES_USER} -d ${var.POSTGRES_DB} -f \"/home/init/01-auth-schema.sql\""
  }
  depends_on = [
    docker_container.supabase-postgres,
    null_resource.db_setup_00,
    time_sleep.sleep_wait
  ]
}

resource "null_resource" "db_setup_02" {
  provisioner "local-exec" {
    command = "docker exec -e PGPASSWORD=${random_password.POSTGRES_PASSWORD.result} -i ${var.POSTGRES_HOST} psql -h ${var.POSTGRES_HOST} -p ${var.POSTGRES_PORT} -U ${var.POSTGRES_USER} -d ${var.POSTGRES_DB} -f \"/home/init/02-storage-schema.sql\""
  }
  depends_on = [
    docker_container.supabase-postgres,
    null_resource.db_setup_01,
    time_sleep.sleep_wait
  ]
}

resource "null_resource" "db_setup_03" {
  provisioner "local-exec" {
    command = "docker exec -e PGPASSWORD=${random_password.POSTGRES_PASSWORD.result} -i ${var.POSTGRES_HOST} psql -h ${var.POSTGRES_HOST} -p ${var.POSTGRES_PORT} -U ${var.POSTGRES_USER} -d ${var.POSTGRES_DB} -f \"/home/init/03-post-setup.sql\""
  }
  depends_on = [
    docker_container.supabase-postgres,
    null_resource.db_setup_02,
    time_sleep.sleep_wait
  ]
}
