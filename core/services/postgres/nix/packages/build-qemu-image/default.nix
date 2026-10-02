{
  cloud-utils,
  coreutils,
  gitMinimal,
  packer,
  qemu,
  writeShellApplication,
  yq,
}:
writeShellApplication {
  name = "build-qemu-image";

  runtimeInputs = [
    cloud-utils
    coreutils
    gitMinimal
    packer
    qemu
    yq
  ];

  text = builtins.readFile ./build-qemu-image.sh;
}
