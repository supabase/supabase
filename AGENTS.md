# Agent guide

Context for AI coding agents working in this repository. Edit this file to add
project-specific guidance — architecture, key commands, and conventions.

## Working style
- Make focused changes and edit files in place.
- Use git for version control; commit in logical, reviewable steps.
- Run the test suite before considering a change done — check `package.json`
  scripts, `Makefile`, `pyproject.toml`, etc.
- Search with ripgrep (`rg`); it's fast and respects `.gitignore`.

## Conventions
- Match the existing code style and project structure.
- Call out any new dependencies you introduce.
- Never commit secrets, `.env` files, or API keys.
