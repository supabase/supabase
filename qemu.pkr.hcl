variable "git_sha" {
  type = string
}

variable "postgres-version" {
  type    = string
  default = ""
}

variable "postgres_major_version" {
  type    = string
  default = ""
}

# Working dir to pick up non-source files and put output files
variable "workdir" {
  type = string
}

# Arch-specific values supplied by build-qemu-image
variable "arch" {
  type = string
}

variable "cpu" {
  type = string
}

variable "machine" {
  type = string
}

variable "qemu_binary" {
  type = string
}

packer {
  required_plugins {
    qemu = {
      source  = "github.com/hashicorp/qemu"
      version = "1.1.6"
    }
  }
}

source "qemu" "cloudimg" {
  boot_wait        = "2s"
  cpus             = 8
  disk_image       = true
  disk_size        = "15G"
  format           = "qcow2"
  headless         = true
  http_directory   = "http"
  iso_checksum     = "file:https://cloud-images.ubuntu.com/minimal/releases/noble/release/SHA256SUMS"
  iso_url          = "https://cloud-images.ubuntu.com/minimal/releases/noble/release/ubuntu-24.04-minimal-cloudimg-${var.arch}.img"
  memory           = 4096 # MiB
  output_directory = "${var.workdir}/output-cloudimg"
  qemu_img_args {
    convert = ["-o", "compression_type=zstd"]
  }
  qemu_binary = var.qemu_binary
  qemuargs = [
    ["-machine", var.machine],
    ["-cpu", var.cpu],
    ["-device", "virtio-gpu-pci"],
    ["-drive", "if=pflash,format=raw,id=ovmf_code,readonly=on,file=${var.workdir}/ovmf_code.fd"],
    ["-drive", "if=pflash,format=raw,id=ovmf_vars,file=${var.workdir}/ovmf_vars.fd"],
    ["-drive", "file=${var.workdir}/output-cloudimg/packer-cloudimg,if=virtio,format=qcow2,discard=on,detect-zeroes=unmap"],
    ["-drive", "file=${var.workdir}/seeds-cloudimg.iso,format=raw,if=virtio"],
  ]
  shutdown_command       = "sudo -S shutdown -P now"
  ssh_handshake_attempts = 500
  ssh_password           = "ubuntu"
  ssh_timeout            = "1h"
  ssh_username           = "ubuntu"
  ssh_wait_timeout       = "1h"
  use_backing_file       = false
}

build {
  name    = "cloudimg.image"
  sources = ["source.qemu.cloudimg"]

  # Copy ansible playbook
  provisioner "shell" {
    inline = ["mkdir /tmp/ansible-playbook"]
  }

  provisioner "file" {
    source      = "ansible"
    destination = "/tmp/ansible-playbook"
  }

  provisioner "file" {
    source      = "audit-specs"
    destination = "/tmp/ansible-playbook"
  }

  provisioner "file" {
    source      = "migrations"
    destination = "/tmp"
  }

  provisioner "file" {
    source      = "ebssurrogate/scripts/cleanup-qemu.sh"
    destination = "/tmp/cleanup-qemu.sh"
  }

  provisioner "shell" {
    environment_vars = [
      "GIT_SHA=${var.git_sha}",
      "POSTGRES_MAJOR_VERSION=${var.postgres_major_version}"
    ]
    use_env_var_file    = true
    script              = "ebssurrogate/scripts/qemu-bootstrap-nix.sh"
    execute_command     = "sudo -S sh -c '. {{.EnvVarFile}} && cd /tmp/ansible-playbook && {{.Path}}'"
    start_retry_timeout = "5m"
    skip_clean          = true
  }
}
