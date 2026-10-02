# QEMU artifact

We build a container image that contains a QEMU qcow2 disk image. Container images are a convenient mechanism to ship the disk image to the nodes where they're needed.

Given the size of the image, the first VM using it on a node might take a while to come up, while the image is being pulled down. The image can be pre-fetched to avoid this; we might also switch to other deployment mechanisms in the future.

### Build process

The current AMI process involves a few steps:

1. nix package is build and published using GHA (`.github/workflows/nix-build.yml`)

- this builds Postgres along with the PG extensions we use.

2. "stage1" build (`amazon-arm64-nix.pkr.hcl`, invoked via `.github/workflows/ami-release-nix.yml`)

- uses an upstream Ubuntu image to initialize the AMI
- installs and configures the majority of the software that gets shipped as part of the AMI (e.g. gotrue, postgrest, ...)

3. "stage2" build (`stage2-nix-psql.pkr.hcl`, invoked via `.github/workflows/ami-release-nix.yml`)

- uses the image published from (2)
- installs and configures the software that is build and published using nix in (1)
- cleans up build dependencies etc

The QEMU artifact process collapses (2) and (3):

a. nix package is build and published using GHA (`.github/workflows/nix-build.yml`)
b. packer build (`qemu-arm64-nix.pkr.hcl`)

- uses an upstream Ubuntu live image as the base
- performs the work that was performed as part of the "stage1" and "stage2" builds
- this work is executed using `ebssurrogate/scripts/qemu-bootstrap-nix.sh`

While the AMI build uses the EBS Surrogate Packer builder to create a minimal boot environment that it then adds things to, the QEMU build merely adds things to the Ubuntu Cloud Image. As such, it's likely possible to make something more minimal with a bit more work, but this was deemed unnecessary for now. Collapsing Stage1 and Stage2 was done in the interest of iteration speed, as executing them together is much faster than saving an artifact off stage1, booting another VM off it, and then executing stage2.

## Publish image for later use

Following `make init alpine-image`, the generated VM image should be bundled as a container image with the name: `supabase-postgres-test` . Publish the built docker image to a registry of your choosing, and use the published image with e.g. KubeVirt.

## Iterating on image

For faster iteration, it's more convenient to build the image on an ubuntu bare-metal node that's part of the EKS cluster you're using. Build the image in the `k8s.io` namespace in order for it to be available for immediate use on that node.

list of packages installed on the EKS to build images:

```
    apt-get install -y git emacs ripgrep vim-tiny byobu build-essential unzip
    curl -L "https://releases.hashicorp.com/packer/1.14.1/packer_1.14.1_linux_$(dpkg --print-architecture).zip" -o packer.zip && unzip packer.zip  && rm -f packer.zip  && sudo mv packer /usr/local/bin/
    apt-get install -y qemu-system qemu-system-arm qemu-utils qemu-efi-aarch64 libvirt-clients libvirt-daemon libqcow-utils software-properties-common git make libnbd-bin nbdkit fuse2fs cloud-image-utils
```

### Dependencies note

Installing `docker.io` on an EKS node might interfere with the k8s setup of the node. You can instead install `nerdctl` and `buildkit`:

```bash
curl -L -O https://github.com/containerd/nerdctl/releases/download/v2.0.0/nerdctl-2.0.0-linux-arm64.tar.gz
tar -xzf nerdctl-2.0.0-linux-arm64.tar.gz
mv ./nerdctl /usr/local/bin/
curl -O -L https://github.com/moby/buildkit/releases/download/v0.17.1/buildkit-v0.17.1.linux-arm64.tar.gz
tar -xzf buildkit-v0.17.1.linux-arm64.tar.gz
mv bin/* /usr/local/bin/
```

You'll need to run buildkit: `buildkitd`
