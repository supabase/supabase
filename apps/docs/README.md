# Reference Docs

Supabase Reference Docs

## Maintainers

If you are a maintainer of any tools in the Supabase ecosystem, you can use this site to provide documentation for the tools & libraries that you maintain.

## DocSpec

We use documentation specifications which can be used to generate human-readable docs.

- OpenAPI: for documenting API endpoints.
- SDKSpec (custom to Supabase): for SDKs and client libraries.
- ConfigSpec (custom to Supabase): for configuration options.
- CLISpec (custom to Supabase): for CLI commands and usage.

The benefit of using custom specifications is that we can generate many other types from a strict schema (eg, HTML and manpages).
It also means that we can switch to any documentation system we want. On this site we use Next.js, but on Supabase's official website, we use a custom React site and expose only a subset of the available API for each tool.

## Contributing

To contribute to docs, see the [style guide](https://github.com/supabase/supabase/tree/master/apps/docs/style-guide) for how to write a page, and the [developers' guide](https://github.com/supabase/supabase/blob/master/apps/docs/DEVELOPERS.md) and [contributing guide](https://github.com/supabase/supabase/blob/master/apps/docs/CONTRIBUTING.md) for repo mechanics. If you write with an AI coding agent, use the `/write-the-docs` skill to draft and `/edit-the-docs` to revise an existing page.
