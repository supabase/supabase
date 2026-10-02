{
  lib,
  pkgs,
  self,
  ...
}:
let
  start-linux-builder = pkgs.writeShellApplication {
    name = "start-linux-builder";
    text = ''
      echo "Starting linux-builder..."

      if sudo launchctl list | grep -q org.nixos.linux-builder; then
          echo "linux-builder is already running"
          exit 0
      fi

      # Use load instead of start to re-enable the service
      if sudo launchctl load -w /Library/LaunchDaemons/org.nixos.linux-builder.plist 2>/dev/null; then
          echo "linux-builder started successfully"
      else
          echo "Error: Could not start linux-builder"
          echo "Make sure nix-darwin is configured with linux-builder enabled"
          exit 1
      fi

      # Check if it's running
      sleep 2
      if sudo launchctl list | grep -q org.nixos.linux-builder; then
          echo "linux-builder is now running"
      else
          echo "Warning: linux-builder may not have started properly"
      fi
    '';
  };
  stop-linux-builder = pkgs.writeShellApplication {
    name = "stop-linux-builder";
    text = ''
      echo "Stopping linux-builder..."

      # Use unload instead of stop because KeepAlive=true will restart it
      if sudo launchctl unload -w /Library/LaunchDaemons/org.nixos.linux-builder.plist 2>/dev/null; then
          echo "linux-builder stopped successfully"
      else
          echo "Warning: Could not stop linux-builder (it may not be running)"
      fi

      # Check if it's still running
      sleep 1
      if sudo launchctl list | grep -q org.nixos.linux-builder; then
          echo "Warning: linux-builder is still running"
          STATUS=$(sudo launchctl list | grep org.nixos.linux-builder || true)
          echo "Current status: $STATUS"
      else
          echo "linux-builder is not running"
      fi
    '';
  };
  verify-darwin-linux-builder = self.packages.aarch64-darwin.verify-darwin-linux-builder;
in
{
  nixpkgs.hostPlatform = "aarch64-darwin";

  # Install builder control scripts
  environment.systemPackages = [
    start-linux-builder
    stop-linux-builder
    verify-darwin-linux-builder
  ];

  nix.settings = {
    experimental-features = [
      "nix-command"
      "flakes"
    ];
    extra-substituters = [ "https://nix-postgres-artifacts.s3.amazonaws.com" ];
    extra-trusted-public-keys = [
      "nix-postgres-artifacts:dGZlQOvKcNEjvT7QEAJbcV6b6uk7VF/hWMjhYleiaLI="
    ];
  };

  nix.extraOptions = ''
    !include nix.custom.conf
  '';

  # accept existing nix.custom.conf
  system.activationScripts.checks.text = lib.mkForce "";
  system.activationScripts.nix-daemon.text = lib.mkForce ''
    if ! diff /etc/nix/nix.conf /run/current-system/etc/nix/nix.conf &> /dev/null || ! diff /etc/nix/machines /run/current-system/etc/nix/machines &> /dev/null; then
        echo "reloading nix-daemon..." >&2
        launchctl kill HUP system/org.nixos.nix-daemon
    fi
    max_wait=30
    waited=0
    while ! nix-store --store daemon -q --hash ${pkgs.stdenv.shell} &>/dev/null; do
        if [ $waited -ge $max_wait ]; then
            echo "ERROR: nix-daemon failed to start after $max_wait seconds" >&2
            exit 1
        fi
        echo "waiting for nix-daemon" >&2
        launchctl kickstart system/org.nixos.nix-daemon
        sleep 1
        waited=$((waited + 1))
    done
  '';

  nix.linux-builder = {
    enable = true;
    ephemeral = true;
    maxJobs = 4;
    supportedFeatures = [
      "kvm"
      "benchmark"
      "big-parallel"
      "nixos-test"
    ];
    config = {
      virtualisation = {
        darwin-builder = {
          diskSize = 40 * 1024;
          memorySize = 8 * 1024;
        };
        cores = 6;
      };
    };
  };

  nix.distributedBuilds = true;

  system.stateVersion = 6;
}
