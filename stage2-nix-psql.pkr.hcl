variable "region" {
  type = string
}

variable "ami_name" {
  type    = string
  default = "supabase-postgres"
}

variable "postgres-version" {
  type    = string
  default = ""
}

variable "git-head-version" {
  type    = string
  default = "unknown"
}

variable "packer-execution-id" {
  type    = string
  default = "unknown"
}

variable "git_sha" {
  type    = string
  default = env("GIT_SHA")
}

variable "postgres_major_version" {
  type    = string
  default = ""
}

variable "source_ami" {
  type        = string
  description = "Source AMI ID from stage 1"
}

variable "instance_type" {
  type    = string
  default = "c6g.4xlarge"
}

packer {
  required_plugins {
    amazon = {
      source = "github.com/hashicorp/amazon"
      # don't use semver for the version since there's no lock files
      # can go back when we can have renovate watching this
      # see https://github.com/hashicorp/packer-plugin-amazon/issues/676
      version = "1.8.0"
    }
  }
}

source "amazon-ebs" "ubuntu" {
  ami_name      = "${var.ami_name}-${var.postgres-version}"
  instance_type = var.instance_type
  region        = "${var.region}"
  source_ami    = "${var.source_ami}"

  communicator = "ssh"
  ssh_pty      = true
  ssh_username = "ubuntu"
  ssh_timeout  = "5m"

  associate_public_ip_address = true

  # Increase timeout for instance stop operations to handle large instances
  aws_polling {
    delay_seconds = 15
    max_attempts  = 120 # 120 * 15s = 30 minutes max wait
  }

  ena_support = true

  # The build volume inherits gp3 max provisioning from the stage1 AMI and
  # CreateImage would carry it into this AMI; pin the shipped AMI to gp3 defaults.
  ami_block_device_mappings {
    device_name           = "/dev/xvda"
    delete_on_termination = true
    volume_size           = 10
    volume_type           = "gp3"
    iops                  = 3000
    throughput            = 125
  }

  run_tags = {
    creator           = "packer"
    appType           = "postgres"
    packerExecutionId = "${var.packer-execution-id}"
  }
  run_volume_tags = {
    creator = "packer"
    appType = "postgres"
  }
  snapshot_tags = {
    creator = "packer"
    appType = "postgres"
  }
  tags = {
    creator           = "packer"
    appType           = "postgres"
    postgresVersion   = "${var.postgres-version}"
    sourceSha         = "${var.git-head-version}"
    packerExecutionId = "${var.packer-execution-id}"
  }
}

build {
  name = "nix-packer-ubuntu"
  sources = [
    "source.amazon-ebs.ubuntu"
  ]

  # Copy ansible playbook
  provisioner "shell" {
    inline = ["mkdir /tmp/ansible-playbook"]
  }

  provisioner "file" {
    source      = "ansible"
    destination = "/tmp/ansible-playbook"
  }

  provisioner "file" {
    source      = "migrations"
    destination = "/tmp"
  }

  provisioner "file" {
    source      = "audit-specs"
    destination = "/tmp/ansible-playbook"
  }

  provisioner "shell" {
    environment_vars = [
      "GIT_SHA=${var.git_sha}",
      "POSTGRES_MAJOR_VERSION=${var.postgres_major_version}"
    ]
    use_env_var_file = true
    script           = "ebssurrogate/scripts/nix-provision.sh"
    execute_command  = "sudo -S sh -c '. {{.EnvVarFile}} && cd /tmp/ansible-playbook && {{.Path}}'"
  }

  provisioner "file" {
    source      = "/tmp/ansible.log"
    destination = "/tmp/ansible-stage2.log"
    direction   = "download"
  }
}
