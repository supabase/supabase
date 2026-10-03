# shellcheck shell=bash

# nix-built qemu resolves its libraries via RPATH; an inherited
# LD_LIBRARY_PATH (e.g. from a devshell) can inject a mismatched glibc and
# break `qemu-system-* --version`, so drop it.
unset LD_LIBRARY_PATH

postgres_major_version=${1:-}
if [ -z "$postgres_major_version" ]; then
	echo "Usage: build-qemu-image <postgres-major-version> [arch]" >&2
	exit 1
fi

case $(uname -o) in
Darwin) accel=hvf ;;
GNU/Linux) accel=kvm ;;
*) echo "Error: Invalid os '$(uname -o)'. Must be Darwin or Linux" >&2 && exit 1 ;;
esac

declare -A host2arch=([aarch64]=arm64 [x86_64]=amd64)
host=${host2arch[$(uname -m)]}
arch=${2:-$host}
case $arch in
amd64)
	qemu=$(which qemu-system-x86_64)
	code=${qemu%/bin/*}/share/qemu/edk2-x86_64-code.fd
	vars=${qemu%/bin/*}/share/qemu/edk2-i386-vars.fd
	;;
arm64)
	qemu=$(which qemu-system-aarch64)
	code=${qemu%/bin/*}/share/qemu/edk2-aarch64-code.fd
	vars=${qemu%/bin/*}/share/qemu/edk2-arm-vars.fd
	;;
*) echo "Error: Invalid arch '$arch'. Must be 'amd64' or 'arm64'" >&2 && exit 1 ;;
esac

case $arch:$(uname -m) in
amd64:aarch64) machine=q35 cpu=qemu64 ;;
amd64:x86_64) machine=q35 cpu=host ;;
arm64:aarch64) machine=virt,gic-version=max,highmem=on cpu=host ;;
arm64:x86_64) machine=virt,gic-version=max,highmem=on cpu=cortex-a76 ;;
esac
machine+=,accel=$accel
if [[ -z ${BUILD_QEMU_IMAGE_HW_VIRT_ONLY:-} ]]; then
	machine+=:tcg
fi

workdir=$(mktemp -d packer-work-qemu-XXXXXX)
install --mode 444 "$code" "$workdir/ovmf_code.fd"
install --mode 644 "$vars" "$workdir/ovmf_vars.fd" # qemu writes to the vars pflash during boot

git_sha=${GIT_SHA:-$(git rev-parse HEAD)}
postgres_version=$(yq -r ".postgres_release[\"postgres$postgres_major_version\"]" ansible/vars.yml)

# Build the cloud-init seed ISO before invoking packer.
cloud-localds "$workdir/seeds-cloudimg.iso" user-data-cloudimg meta-data

export LC_ALL=C.UTF-8
export TZ=UTC
packer init qemu.pkr.hcl
PACKER_LOG=${PACKER_LOG:-1} packer build \
	-var "arch=$arch" \
	-var "cpu=$cpu" \
	-var "git_sha=$git_sha" \
	-var "machine=$machine" \
	-var "postgres-version=$postgres_version" \
	-var "postgres_major_version=$postgres_major_version" \
	-var "qemu_binary=$qemu" \
	-var "workdir=$workdir" \
	qemu.pkr.hcl
