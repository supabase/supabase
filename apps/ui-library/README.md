This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Supabase types

To regenerate the Supabase database types, run

```
supabase gen types --local > registry/default/fixtures/database.types.ts
```

## Block architecture

Add `showFiles` to `BlockOverview` to display the registry's folder tree and source code in a Files tab. Keep installation notes in the page body; the folder tree is rendered once in the overview. Markdown exports retain the tree and registry source link.

Wrap a block's preview in `<BlockOverview name="registry-item-name">`, or use a self-closing element for blocks without a preview. The shared overview reads the resolved registry definition, including its client files. Installed paths determine pages, routes, middleware, components, and helpers. Files under `supabase/functions/<name>` become one Edge Function.

The displayed overview summarizes application structure: pages, components, server routes, Edge Functions, and data resources. Client helpers, hooks, configuration, and other implementation files remain in the file tree. Use descriptive labels and explain each resource's purpose. Use `kind: "capability"` for a meaningful feature implemented across helper files, such as billing operations. Blocks that only supply helpers are summarized as one capability.

Declare resources that cannot be derived from file paths in the registry item's `meta.architecture.resources`, such as tables created by setup instructions, Storage buckets, or existing services. Each resource has an `id`, `kind`, and `label`; optional `description`, `files`, and `status` fields describe its provenance. Use `status: "existing"` for resources the block uses without creating them. Declared `files` can group or override resources inferred from those installed paths. SQL migration filenames do not imply that a table is created.

Use `meta.architecture.relationships` to connect resource IDs with `source`, `target`, and an optional `label`. Connections describe declared relationships; filenames alone do not imply runtime connections. See the [MCP definition](registry/default/blocks/mcp-server/registry-item.json) for an Edge Function connected to existing Auth, and [starter definitions](config/starter-architecture.ts) for tables and buckets supplied by templates. Run `pnpm test:architecture` to validate generation and documentation coverage.
