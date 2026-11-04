# Supabase Docs

This directory contains the Next.js app for [supabase.com/docs](https://supabase.com/docs).

Guides live in `content/` as MDX. Reference pages are generated from the specs in `spec/`: OpenAPI, SDKSpec, ConfigSpec, and CLISpec. Some sections come from other repositories.

## Where to go

- To write a page, follow the [style guide](./style-guide/README.md).
- To find where a page lives, add one, or update generated reference docs, use the [contributing guide](./CONTRIBUTING.md). Library maintainers start at [Reference structure](./CONTRIBUTING.md#reference-structure).
- To use an agent, use the [AI agent skills for docs authoring](./CONTRIBUTING.md#ai-agent-skills-for-docs-authoring). Those skills include framing a page and placing it in the information architecture.
- To run the site locally, use the [developers' guide](./DEVELOPERS.md).
- To add or change a redirect, read [`lib/redirects/README.md`](./lib/redirects/README.md) first.
