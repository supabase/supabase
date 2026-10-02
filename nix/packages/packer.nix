{
  pkgs,
  lib,
  fetchFromGitHub,
  installShellFiles,
  ...
}:
let
  buildGoModule = pkgs.buildGoModule;
in
buildGoModule rec {
  pname = "packer";
  version = "1.14.1";

  src = fetchFromGitHub {
    owner = "hashicorp";
    repo = "packer";
    rev = "v${version}";
    hash = "sha256-3g9hsmrfLzGhjcGvUza/L9PMGUFw+KLbg2pIK0CxlQI=";
  };

  vendorHash = "sha256-F6hn+pXPyPe70UTK8EF24lk7ArYz7ygUyVVsatW6+hI=";

  subPackages = [ "." ];

  ldflags = [
    "-s"
    "-w"
  ];

  nativeBuildInputs = [ installShellFiles ];

  postInstall = ''
    installShellCompletion --zsh contrib/zsh-completion/_packer
  '';

  meta = {
    description = "Tool for creating identical machine images for multiple platforms from a single source configuration";
    homepage = "https://www.packer.io";
    license = lib.licenses.bsl11;
    changelog = "https://github.com/hashicorp/packer/blob/v${version}/CHANGELOG.md";
  };
}
