# Docs SSH Server

An SSH server that exposes Supabase docs as a sandboxed virtual filesystem, designed for LLM consumption. Connect and use standard Unix tools (`grep`, `find`, `cat`, `tree`) to navigate and search the docs.

Commands run inside [just-bash](https://github.com/vercel-labs/just-bash) - a sandboxed in-memory shell - so it's safe to expose publicly.

## Setup

**1. Build the markdown files** (from `apps/docs/`):

```bash
pnpm run build:guides-markdown
```

This generates `public/docs/guides/**/*.md` which the server mounts as `/docs`.

**2. Start the SSH server** (from `apps/docs/ssh-server/`):

```bash
docker compose up
```

The server listens on port 22. A host key is generated on first run and saved to `keys/host_key` so the fingerprint stays stable across restarts.

## Usage

```bash
# List top-level sections
ssh localhost ls /docs

# Get a full tree of available docs
ssh localhost tree /docs

# Search across all docs
ssh localhost "grep -r 'vector embeddings' /docs"

# Read a specific file
ssh localhost cat /docs/ai/vector-columns.md

# Pipe commands (always quote to prevent local shell expansion)
ssh localhost "grep -rl 'storage' /docs | head -10"

# Interactive shell (note: no PTY support yet - tab completion, arrow keys, etc. not available)
ssh localhost
```

## Simulating a deployed environment

To use `docs.supabase.com` as the hostname (matching what a deployed version might look like), add this to `/etc/hosts`:

```
127.0.0.1 docs.supabase.com
```

Then connect normally:

```bash
ssh docs.supabase.com "grep -r 'auth' /docs/auth/"
```

Remove the entry from `/etc/hosts` when done.

## Demo

The `demo/` folder contains an `AGENTS.md` system prompt (`CLAUDE.md` symlinked) demonstrating how we might show an agent how to access the docs via this server.

```bash
# Example: ask Claude about a specific topic
# Claude will run something like:
ssh docs.supabase.com "grep -r 'row level security' /docs/database/ | head -40"
```

## Aliases

The following aliases are available as a convenience:

| Alias | Expands to |
| ----- | ---------- |
| `ll`  | `ls -alF`  |
| `la`  | `ls -a`    |
| `l`   | `ls -CF`   |
