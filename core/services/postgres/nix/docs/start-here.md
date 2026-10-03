## Uninstall Previous Nix Installation (if applicable)

If you previously installed Nix using the Determinate Systems installer, you'll need to uninstall it first:

```bash
sudo /nix/nix-installer uninstall
```

If you installed Nix using a different method, follow the appropriate uninstall procedure for that installation method before proceeding.

## Update Existing Official Nix Installation

If you already have the official Nix installer (not Determinate Systems) installed, you can simply update your configuration instead of reinstalling:

### Step 1: Edit /etc/nix/nix.conf

Extend the following configuration in `/etc/nix/nix.conf`:

```conf
experimental-features = nix-command flakes
extra-substituters = https://nix-postgres-artifacts.s3.amazonaws.com
extra-trusted-public-keys = nix-postgres-artifacts:dGZlQOvKcNEjvT7QEAJbcV6b6uk7VF/hWMjhYleiaLI=
```

> [!CAUTION]
> DO NOT add anyone to `trusted-users` in `/etc/nix/nix.conf` as it [grants root without password](https://nix.dev/manual/nix/stable/command-ref/conf-file.html#conf-trusted-users). Instead, add the binary cache to `extra-substituters` and `extra-trusted-public-keys`.

Read about the binary cache in [/nix/docs/binary-cache.md](/nix/docs/binary-cache.md).

### Step 2: Restart the Nix Daemon

After updating the configuration, restart the Nix daemon:

**On macOS:**
```bash
sudo launchctl stop org.nixos.nix-daemon
sudo launchctl start org.nixos.nix-daemon
```

**On Linux (systemd):**
```bash
sudo systemctl restart nix-daemon
```

Your Nix installation is now configured with the proper build caches and should work without substituter errors.

## Install Nix (Fresh Installation)

We'll use the official Nix installer with a custom configuration that includes our build caches and settings. This works on many platforms, including **aarch64 Linux**, **x86_64 Linux**, and **macOS**.

### Step 1: Create nix.conf

First, create a file named `nix.conf.extra` with the following content:

```conf
experimental-features = nix-command flakes
extra-substituters = https://nix-postgres-artifacts.s3.amazonaws.com
extra-trusted-public-keys = nix-postgres-artifacts:dGZlQOvKcNEjvT7QEAJbcV6b6uk7VF/hWMjhYleiaLI=
```

> [!CAUTION]
> DO NOT add anyone to `trusted-users` in `/etc/nix/nix.conf` as it [grants root without password](https://nix.dev/manual/nix/stable/command-ref/conf-file.html#conf-trusted-users). Instead, add the binary cache to `extra-substituters` and `extra-trusted-public-keys`.

Read about the binary cache in [/nix/docs/binary-cache.md](/nix/docs/binary-cache.md).

### Step 2: Install Nix 2.34.6

Run the following command to install Nix 2.34.6 (the version used in CI) with the custom configuration:

```bash
curl -L https://releases.nixos.org/nix/nix-2.34.6/install | sh -s -- --daemon --yes --nix-extra-conf-file ./nix.conf
```

This will install Nix with our build caches pre-configured, which should eliminate substituter-related errors.

After you do this, **you must log in and log back out of your desktop
environment** (or restart your terminal session) to get a new login session. This is so that your shell can have
the Nix tools installed on `$PATH` and so that your user shell can see the
extra settings.

You should now be able to do something like the following; try running these
same commands on your machine:

```
$ nix --version
nix (Nix) 2.34.6
```

```
$ nix run nixpkgs#nix-info -- -m
 - system: `"x86_64-linux"`
 - host os: `Linux 5.15.90.1-microsoft-standard-WSL2, Ubuntu, 22.04.2 LTS (Jammy Jellyfish), nobuild`
 - multi-user?: `yes`
 - sandbox: `yes`
 - version: `nix-env (Nix) 2.34.6`
 - channels(root): `"nixpkgs"`
 - nixpkgs: `/nix/var/nix/profiles/per-user/root/channels/nixpkgs`
```

If the above worked, you're now cooking with gas!

## Do some fun stuff

One of the best things about Nix that requires _very little_ knowledge of it is
that it lets you install the latest and greatest versions of many tools _on any
Linux distribution_. We'll explain more about that later on. But just as a few
examples:

- **Q**: I want the latest version of Deno. Can we get that?
- **A**: `nix profile install nixpkgs#deno`, and you're done!

<!-- break bulletpoints -->

- **Q**: What about HTTPie? A nice Python application?
- **A**: Same idea: `nix profile install nixpkgs#httpie`

<!-- break bulletpoints -->

- **Q**: What about my favorite Rust applications, like ripgrep and bat?
- **A.1**: `nix profile install nixpkgs#ripgrep`
- **A.2**: `nix profile install nixpkgs#bat`
- **A.3**: And yes, you also have exa, fd, hyperfine, and more!
