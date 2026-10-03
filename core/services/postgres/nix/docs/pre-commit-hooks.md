# Pre-commit Hooks

This repository uses [git-hooks.nix](https://github.com/cachix/git-hooks.nix) and [pre-commit](https://pre-commit.com) to automatically run checks before commits.

## What it does

The pre-commit hooks are configured to run `treefmt` which formats Nix files using:

- **nixfmt** (RFC-style) for Nix code formatting
- **deadnix** for removing dead/unused Nix code

## Setup

### Automatic Setup (Recommended)

If you're using the development shell (via `nix develop` or direnv), the pre-commit hooks are automatically installed and will run before each commit.

## Usage

### Automatic Formatting on Commit

Once set up, the hooks will automatically run before each commit:

```bash
git add .
git commit -m "your commit message"
# treefmt will run automatically and format files if needed
```

If formatting changes are made, the commit will be aborted and you'll need to review and stage the changes:

```bash
# Review the formatting changes
git diff

# Stage the formatted files
git add .

# Commit again
git commit -m "your commit message"
```

### Manual Formatting

You can also run the formatter manually at any time. See [nix-formatter.md](./nix-formatter.md) for details on using `treefmt`.

### Bypassing Hooks (Not Recommended)

If you need to bypass the pre-commit hooks (not recommended for normal development):

```bash
git commit --no-verify -m "your commit message"
```

Note that this check will be enforced in CI, so it's best to always run the hooks locally.

## Configuration

The pre-commit hooks are configured in:

- **`nix/hooks.nix`** - Main git-hooks configuration
- **`nix/fmt.nix`** - treefmt formatter configuration

## Best Practices

1. **Always run formatting before pushing** - Even if you bypass hooks locally, CI may reject improperly formatted code
2. **Review formatting changes** - Don't blindly accept all formatting changes; review them to ensure they make sense
3. **Keep formatting commits separate** - If you need to make large formatting changes, consider doing them in a separate commit
4. **Use the development shell** - The easiest way to ensure everything works is to use `nix develop` or direnv
