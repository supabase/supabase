## Prerequisites

Running NixOS tests on macOS requires a Linux builder VM because NixOS tests need a Linux environment.
This project includes a nix-darwin configuration that sets up a linux-builder VM automatically.

You need:
- macOS with Apple Silicon (aarch64-darwin)
- Nix installed (see [Getting Started](start-here.md)) preferably a recent version (2.30+)

## Setup

Run the setup script to configure nix-darwin with the linux-builder:

```bash
nix run .#setup-darwin-linux-builder
```

Note that you don't have to checkout the repository to run the setup, you can run it directly from GitHub:

```bash
nix run github:supabase/postgres#setup-darwin-linux-builder
```

This command will:
- Back up existing system files (`/etc/nix/nix.conf`, `/etc/bashrc`, `/etc/zshrc`)
- Configure nix-darwin with the linux-builder VM
- Install helper scripts for managing the builder

The linux-builder VM is configured with:
- 6 CPU cores
- 8GB RAM
- 40GB disk
- Support for both x86_64-linux and aarch64-linux builds
- The `nixos-test` feature required for running NixOS tests

After setup completes, restart your shell to access the helper commands.

## Verify the setup

The setup script runs verification automatically after configuration.
You can also run verification manually at any time:

```bash
nix run .#verify-darwin-linux-builder
```

Or after setup, use the installed command:

```bash
verify-darwin-linux-builder
```

The verification script checks:

1. Launchd service status (running vs loaded-but-stopped)
2. Nix configuration via `nix config show` (substituters, trusted keys, experimental features)
3. Builder features (`/etc/nix/machines` includes `nixos-test`)
4. Builder responsiveness (test build of `nixpkgs#hello` for aarch64-linux)

Each check reports pass/fail with actionable guidance on failures.

You can also manually test that the linux-builder is working by building a simple package for Linux:

```bash
nix build --system x86_64-linux nixpkgs#hello
nix build --system aarch64-linux nixpkgs#hello
```

If both commands succeed, the linux-builder is ready for NixOS tests.

## Running NixOS tests

NixOS tests are defined in `nix/ext/tests/` and exposed as flake checks.
To run a test on macOS, use the `aarch64-darwin` system attribute:

```bash
nix build .#checks.aarch64-darwin.ext-pgjwt -L
```

The `-L` flag shows logs during the build, which is helpful for seeing test progress and debugging failures.

If the nix build exit immediately with success, it means that the result was fetched from cache and the test passed previously.
To force a re-run of the test, use the `--rebuild` flag:

```bash
nix build .#checks.aarch64-darwin.ext-pgjwt -L --rebuild
```

### Available tests

List all available checks with:

```bash
nix flake show --json 2>/dev/null | jq -r '.checks["aarch64-darwin"] | keys[]' | sort
```

Extension tests follow the naming pattern `ext-<extension_name>`:

```bash
nix build .#checks.aarch64-darwin.ext-pgjwt -L
nix build .#checks.aarch64-darwin.ext-postgis -L
nix build .#checks.aarch64-darwin.ext-vector -L
nix build .#checks.aarch64-darwin.ext-pg_graphql -L
```

## Managing the linux-builder VM

The setup installs two helper commands for controlling the VM:

```bash
stop-linux-builder   # Stop the VM (pauses resource usage)
start-linux-builder  # Start the VM again
```

As the VM can consume significant resources, you may want to stop it when not running tests using `stop-linux-builder`.
When stopped with `stop-linux-builder`, the service is unloaded to prevent automatic restart.
Use `start-linux-builder` to re-enable and start the service.

### Checking VM status

```bash
sudo launchctl list | grep linux-builder
```

If the VM is running, you'll see a line containing `org.nixos.linux-builder`.

## Troubleshooting

### Tests fail with "builder not available"

Ensure the linux-builder is running:

```bash
start-linux-builder
```

Then verify with a simple build:

```bash
nix build --system aarch64-linux nixpkgs#hello
```

### VM won't start after reboot

If the VM doesn't start automatically, run:

```bash
start-linux-builder
```

The VM is configured as ephemeral, meaning it's recreated fresh on each start.
This ensures a clean environment but requires re-downloading cached build artifacts.

### Slow first build

The first NixOS test run may download significant data.
Subsequent runs benefit from the Nix store cache and the project's binary cache at `nix-postgres-artifacts.s3.amazonaws.com`.

## How it works

The linux-builder is a QEMU virtual machine managed by nix-darwin.
When you run a build targeting Linux (like NixOS tests), Nix automatically delegates the build to this VM.

Key configuration from `nix/hosts/darwin-nixostest/darwin-configuration.nix`:

```nix
nix.linux-builder = {
  enable = true;
  ephemeral = true;
  maxJobs = 4;
  supportedFeatures = [
    "kvm"
    "benchmark"
    "big-parallel"
    "nixos-test"  # Required for NixOS integration tests
  ];
  config = {
    virtualisation = {
      darwin-builder = {
        diskSize = 40 * 1024;  # 40GB
        memorySize = 8 * 1024; # 8GB
      };
      cores = 6;
    };
  };
};
```

The `nixos-test` supported feature is what enables running NixOS VM tests from macOS.
