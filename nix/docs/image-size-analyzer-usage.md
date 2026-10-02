# Image Size Analyzer - Usage Guide

A tool to analyze Docker image sizes for Supabase Postgres images, providing breakdowns by layers, directories, Nix packages, and APT packages.

## Local Usage

### Prerequisites

- Nix with flakes enabled
- Docker daemon running

### Basic Commands

```bash
# Analyze all images (Dockerfile-15, Dockerfile-17, Dockerfile-orioledb-17)
# This will build all images first, then analyze them
nix run .#image-size-analyzer

# Analyze a specific image
nix run .#image-size-analyzer -- --image Dockerfile-17

# Analyze multiple specific images
nix run .#image-size-analyzer -- --image Dockerfile-15 --image Dockerfile-17

# Skip building (analyze existing images)
# Images must already exist with the -analyze tag suffix
nix run .#image-size-analyzer -- --no-build

# Output as JSON instead of TUI
nix run .#image-size-analyzer -- --json

# Combine flags
nix run .#image-size-analyzer -- --image Dockerfile-17 --json --no-build
```

### Understanding the Output

The TUI output shows four sections per image:

1. **Total Size** - Overall image size
2. **Layers** - Top 10 Docker layers by size, showing which Dockerfile instructions add the most
3. **Directories** - Top 10 directories by size inside the image
4. **Nix Packages** - Top 15 Nix store packages by size (e.g., postgresql, postgis, extensions)
5. **APT Packages** - Top 15 Debian packages by size

### Example Workflow

```bash
# 1. Make changes to reduce image size (e.g., remove an extension)

# 2. Build and analyze the specific image you changed
nix run .#image-size-analyzer -- --image Dockerfile-17

# 3. Compare with JSON output for precise numbers
nix run .#image-size-analyzer -- --image Dockerfile-17 --json > before.json

# 4. Make more changes, then compare
nix run .#image-size-analyzer -- --image Dockerfile-17 --json > after.json
diff before.json after.json
```

---

## CI Usage

### Size Threshold Check

Add a job that fails if images exceed a size threshold:

```yaml
  check-size-threshold:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Nix
        uses: cachix/install-nix-action@v27
        with:
          extra_nix_config: |
            extra-substituters = https://nix-postgres-artifacts.s3.amazonaws.com
            extra-trusted-public-keys = nix-postgres-artifacts:dGZlQOvKcNEjvT7QEAJbcV6b6uk7VF/hWMjhYleiaLI=

      - name: Check image sizes
        run: |
          nix run .#image-size-analyzer -- --json > sizes.json

          # Set threshold (2.5 GB in bytes)
          THRESHOLD=2684354560

          # Check each image
          for dockerfile in Dockerfile-15 Dockerfile-17 Dockerfile-orioledb-17; do
            size=$(jq -r ".images[] | select(.dockerfile == \"$dockerfile\") | .total_size_bytes" sizes.json)
            if [ "$size" -gt "$THRESHOLD" ]; then
              echo "ERROR: $dockerfile exceeds size threshold"
              echo "  Size: $((size / 1048576)) MB"
              echo "  Threshold: $((THRESHOLD / 1048576)) MB"
              exit 1
            fi
            echo "OK: $dockerfile = $((size / 1048576)) MB"
          done
```

### Size Regression Check

Compare against a baseline to catch size regressions:

```yaml
  check-size-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Need full history for base branch

      - name: Install Nix
        uses: cachix/install-nix-action@v27
        with:
          extra_nix_config: |
            extra-substituters = https://nix-postgres-artifacts.s3.amazonaws.com
            extra-trusted-public-keys = nix-postgres-artifacts:dGZlQOvKcNEjvT7QEAJbcV6b6uk7VF/hWMjhYleiaLI=

      - name: Analyze PR branch
        run: |
          nix run .#image-size-analyzer -- --image Dockerfile-17 --json > pr-sizes.json

      - name: Analyze base branch
        run: |
          git checkout ${{ github.base_ref }}
          nix run .#image-size-analyzer -- --image Dockerfile-17 --json > base-sizes.json
          git checkout -

      - name: Compare sizes
        run: |
          PR_SIZE=$(jq -r '.images[0].total_size_bytes' pr-sizes.json)
          BASE_SIZE=$(jq -r '.images[0].total_size_bytes' base-sizes.json)

          DIFF=$((PR_SIZE - BASE_SIZE))
          DIFF_MB=$((DIFF / 1048576))

          # Allow up to 50MB increase
          MAX_INCREASE=52428800

          if [ "$DIFF" -gt "$MAX_INCREASE" ]; then
            echo "ERROR: Image size increased by ${DIFF_MB}MB (max allowed: 50MB)"
            echo "Base: $((BASE_SIZE / 1048576))MB"
            echo "PR: $((PR_SIZE / 1048576))MB"
            exit 1
          fi

          echo "Size change: ${DIFF_MB}MB"
```

---

## JSON Output Schema

```json
{
  "images": [
    {
      "dockerfile": "Dockerfile-17",
      "total_size_bytes": 1954000000,
      "layers": [
        {
          "index": 0,
          "size_bytes": 890000000,
          "command": "COPY /nix/store /nix/store"
        }
      ],
      "directories": [
        {
          "path": "/nix/store",
          "size_bytes": 1200000000
        }
      ],
      "nix_packages": [
        {
          "name": "postgresql-17.6",
          "size_bytes": 152000000
        }
      ],
      "apt_packages": [
        {
          "name": "libc6",
          "size_bytes": 12500000
        }
      ]
    }
  ]
}
```

---

## Tips

1. **Use `--no-build` for iteration** - Once you've built an image, use `--no-build` to quickly re-analyze without rebuilding.

2. **Focus on Nix packages** - Most of the image size comes from `/nix/store/`. The Nix packages breakdown helps identify which extensions or dependencies are largest.

3. **Check layers for optimization opportunities** - If a layer is unexpectedly large, investigate the corresponding Dockerfile instruction.

4. **Use JSON for automation** - The JSON output is stable and can be parsed with `jq` for scripting and CI integration.

5. **Compare before/after** - Always capture baseline sizes before making changes so you can measure the impact.
