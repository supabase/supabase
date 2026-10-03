{ pkgs, lib, ... }:
let
  pg-startup-profiler = pkgs.buildGoModule {
    pname = "pg-startup-profiler";
    version = "0.1.0";

    src = ./pg-startup-profiler;

    vendorHash = "sha256-l2GzYzHuMHVX9BsFKwxMEE2/hqBBnC/GZx6z9sUfqBU=";

    subPackages = [ "cmd/pg-startup-profiler" ];

    # Disable CGO for simpler builds (eBPF stub for non-Linux)
    env.CGO_ENABLED = "0";

    ldflags = [
      "-s"
      "-w"
      "-X main.version=0.1.0"
    ];

    doCheck = true;
    checkPhase = ''
      go test -v ./...
    '';

    meta = with lib; {
      description = "PostgreSQL container startup profiler";
      mainProgram = "pg-startup-profiler";
      license = licenses.asl20;
      platforms = platforms.linux ++ platforms.darwin;
    };
  };
in
{
  inherit pg-startup-profiler;
}
