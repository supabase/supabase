# Reference Docs

Supabase Reference Docs

## Maintainers

If you are a maintainer of any tools in the Supabase ecosystem, you can use this site to provide documentation for the tools & libraries that you maintain.

## Versioning

All tools have versioned docs, which are kept in separate folders. For example, the CLI has the following folders and files:

- `cli`: the "next" release.
- `cli_spec`: contains the DocSpec for the "next" release (see below).
- `cli_versioned_docs`: a version of the documentation for every release (including the most current version).
- `cli_versioned_sidebars`: a version of the sidebar for every release (including the most current version).

When you release a new version of a tool, you should also release a new version of the docs. You can do this via the command line. For example, if you just released the CLI version `1.0.1`:

```
npm run cli:version 1.0.1
```

## DocSpec

We use documentation specifications which can be used to generate human-readable docs.

- OpenAPI: for documenting API endpoints.
- SDKSpec (custom to Supabase): for SDKs and client libraries.
- ConfigSpec (custom to Supabase): for configuration options.
- CLISpec (custom to Supabase): for CLI commands and usage.

The benefit of using custom specifications is that we can generate many other types from a strict schema (eg, HTML and manpages).
It also means that we can switch to any documentation system we want. On this site we use Next.JS, but on Supabase's official website, we use a custom React site and expose only a subset of the available API for each tool.

## Contributing

To contribute to docs, see the [developers' guide](https://github.com/supabase/supabase/blob/master/apps/docs/DEVELOPERS.md) and [contributing guide](https://github.com/supabase/supabase/blob/master/apps/docs/CONTRIBUTING.md).
