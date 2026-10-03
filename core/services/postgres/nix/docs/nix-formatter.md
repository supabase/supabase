# Code Formatting

This repository uses [treefmt](https://treefmt.com/) with [nixfmt](https://github.com/NixOS/nixfmt) and [deadnix](https://github.com/astro/deadnix) to maintain consistent formatting and clean code in Nix files.

## Formatting Tools

### nixfmt-rfc-style

- **Purpose**: Formats Nix code according to [RFC 166](https://github.com/NixOS/rfcs/blob/master/rfcs/0166-nix-formatting.md) style guidelines
- **What it does**:

    - Standardizes indentation and spacing
    - Formats function calls and attribute sets consistently
    - Ensures consistent line breaks and alignment

### deadnix

- **Purpose**: Removes unused/dead code from Nix expressions
- **What it does**:

    - Identifies unused variables and bindings
    - Removes unused function arguments
    - Cleans up dead code paths

## Usage

### Command Line

```bash
# Run treefmt and format all Nix files in the repository
nix fmt
```

### In Development Shell

The formatter is available when you enter the development shell:

```bash
# Enter development shell
nix develop

# Format all nix files
treefmt

# Format specific files
treefmt file1.nix file2.nix

# Check formatting without making changes
treefmt --check

# Format with verbose output
treefmt --verbose
```

### With direnv

If you're using direnv, the formatter is automatically available:

```bash
cd /path/to/project
treefmt
```

## Configuration

The formatter configuration is defined with nix in `nix/fmt.nix` using [treefmt-nix](https://github.com/numtide/treefmt-nix).
See the [treefmt-nix project documentation](https://github.com/numtide/treefmt-nix?tab=readme-ov-file#supported-programs)
for the list of supported formatters and their configurations.

## Integration with Pre-commit Hooks

The formatter is automatically run via pre-commit hooks (see [pre-commit-hooks.md](./pre-commit-hooks.md)) to ensure all committed code is properly formatted.

## Best Practices

### 1. Run Formatter Before Committing

```bash
nix fmt
git add .
git commit -m "your message"
```

### 2. Review Formatting Changes

Sometimes we want to first review formatting changes to ensure they're sensible:

```bash
# See what would be changed
treefmt --check --diff
```

## Editor Integration

### VS Code

Use the [Nix IDE extension](https://marketplace.visualstudio.com/items?itemName=jnoortheen.nix-ide) with treefmt support.
