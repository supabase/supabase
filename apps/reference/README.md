# Reference Docs

Home to all of the documentation for Supabase. Built with [https://docusaurus.io/](Docusaurus) and [https://typesense.org/](typesense)

## Maintainers

If you are a maintainer of any tools in the Supabase ecosystem, you can use this site to provide documentation for the tools & libraries that you maintain.

## Types of docs

There are many types of docs:

1. Guides: teach developers how to use a product. "I have XX problem, how do I solve it?"
2. Tutorials: walk-throughs, have a large outcome. "Build a React application with Supabase".
3. Explanations: teach developers about a broad topic. "What is a database?"
4. Reference: technical descriptions of tools and how to use them. "What errors does the API return?"

In these docs, you should focus only on the fourth type: "Reference Docs".

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
It also means that we can switch any documentation system we want. On this site we use Docusaurus, but in Supabase's official website we use a custom React site and expose only a subset of the available API for each tool.

## Local setup

To run the docs locally, you need to:

- Clone the main [https://github.com/supabase/supabase](Supabase repo)
  — Run `npm install` from root of the repo
- Run `npm run dev` from the root of the repo, or from the `apps/reference` directory (if you want to run the reference docs only)
- Access the docs from [http://localhost:3010/docs/](http://localhost:3010/docs/)

## How to contribute?

- Branch from `master` and name your branches with the following structure
  - `{type}/{branch_name}`
    - Type: `chore | fix | feature`
    - The branch name is arbitrary — just make sure it summarizes the work.
- When you send a PR to `master`, tag [https://github.com/dannykng](@dannykng) for a review.

### Which files to edit?

Our docs site are comprised of guides, tutorials, quickstarts as well as reference docs. It's important to note that these reference docs (located at https://supabase.com/docs/reference) are generated from spec files. As the DocSpec section above notes, we use documentation specs to generate human-readable docs.

Two quick examples to help clarify this:

1. If you want to update the doc for the supabase-js [https://supabase.com/docs/reference/javascript/auth-signup](<`signUp()`>) function, you would need to edit that in the supabase-js [https://github.com/supabase/supabase/edit/master/spec/supabase_js_v1_legacy.yml](spec file). The files generated from these spec files are included in the repo, so it can be confusing to know which file to edit. Just make sure you're not editing a file in a `_generated` directory, nor editing a file with a `custom_edit_url` field in the frontmatter at the top of the doc.

2. If you want to update the [https://supabase.com/docs/guides/with-svelte](Svelte Quickstart), you can see this [https://github.com/supabase/supabase/blob/master/apps/reference/docs/guides/with-svelte.mdx](page) doesn't live in a `_generated` directory, nor does it have a `custom_edit_url` field in the frontmatter. You can edit this file directly.
