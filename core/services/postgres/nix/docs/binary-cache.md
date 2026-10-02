# Using the Nix binary cache

If you don't use the binary cache, it might take hours to build stuff you could just download, already built by CI.

## NixOS or nix-darwin or system-manager

Add this to your system configuration:

```nix
{
  nix.settings.extra-substituters = [
    "https://nix-postgres-artifacts.s3.amazonaws.com"
  ];
  nix.settings.extra-trusted-public-keys = [
    "nix-postgres-artifacts:dGZlQOvKcNEjvT7QEAJbcV6b6uk7VF/hWMjhYleiaLI="
  ];
}
```

Switch to the new configuration:

```sh
sudo nixos-rebuild switch
# or
sudo nix-darwin switch
```

## Nix without NixOS or nix-darwin

If you don't have an immutable system configuration, you'll need to edit the nix config manually.

Edit this file:

```text
/etc/nix/nix.conf
```

Extend it with this:

```conf
extra-substituters = https://nix-postgres-artifacts.s3.amazonaws.com
extra-trusted-public-keys = nix-postgres-artifacts:dGZlQOvKcNEjvT7QEAJbcV6b6uk7VF/hWMjhYleiaLI=
```

> [!CAUTION]
> DO NOT add anyone to `trusted-users` in `/etc/nix/nix.conf` as it [grants root without password](https://nix.dev/manual/nix/stable/command-ref/conf-file.html#conf-trusted-users). Instead, add the binary cache to `extra-substituters` and `extra-trusted-public-keys`.

Restart the nix daemon to load the new config:

**On macOS:**
```bash
sudo launchctl stop org.nixos.nix-daemon
sudo launchctl start org.nixos.nix-daemon
```

**On Linux (systemd):**
```bash
sudo systemctl restart nix-daemon
```

