# Developing Supabase

1. [Getting started](#getting-started)
   - [Install dependencies](#install-dependencies)
2. [Local development](#local-development)
   - [Fork the repository](#fork-the-repository)
   - [Clone the repo](#clone-the-repo)
   - [Running turborepo](#running-turborepo)
     - [Shared components](#shared-components)
     - [Installing packages](#installing-packages)
   - [New Supabase docs](#new-supabase-docs)
3. [Create a pull request](#create-a-pull-request)

- [Common tasks](#common-tasks)
  - [Add a redirect](#add-a-redirect)
- [Community channels](#community-channels)

## Getting started

Thank you for expressing your interest in [Supabase](https://supabase.com) and your willingness to contribute!

To ensure a positive and inclusive environment, we kindly request you to read our [code of conduct](https://github.com/supabase/.github/blob/main/CODE_OF_CONDUCT.md). Additionally, we encourage you to explore the existing [issues](https://github.com/supabase/supabase/issues) to see how you can make a meaningful impact. This document will guide you through the process of setting up your development environment, enabling you to successfully build and test [Supabase](https://supabase.com).

### Install dependencies

You will need to install and configure the following dependencies on your machine to build [Supabase](https://supabase.com):

- [Git](http://git-scm.com/)
- [Node.js v18.x (LTS)](http://nodejs.org)
- [npm](https://www.npmjs.com/) version 9.x.x

## Local development

We are in the process of migrating this repository to monorepo, using [Turborepo](https://turborepo.org/docs).

Eventually, all the apps will be run using [Turborepo](https://turborepo.org/docs), which will significantly improve the developer workflow.

### Fork the repository

To contribute code to [Supabase](https://supabase.com), you must fork the [Supabase Repository](https://github.com/supabase/supabase).

### Clone the repo

1. Clone your GitHub forked repository:

   ```sh
   git clone https://github.com/<github_username>/supabase.git
   ```

2. Go to the Supabase directory:
   ```sh
   cd supabase
   ```

### Running turborepo

[Supabase](https://supabase.com) uses [Turborepo](https://turborepo.org/docs) to manage and run this monorepo.

1. Install the dependencies in the root of the repo.

   ```sh
   npm install # install dependencies
   ```

2. After that you can run the apps simultaneously with the following.
   ```sh
   npm run dev # start all the applications
   ```

Then visit, and edit, any of the following sites:

| Site                                                     | Directory    | Scope name | Description                          | Local development server   |
| -------------------------------------------------------- | ------------ | ---------- | ------------------------------------ | -------------------------- |
| [supabase.com](https://supabase.com)                     | `/apps/www`  | www        | The main website                     | http://localhost:3000      |
| [supabase.com/dashboard](https://supabase.com/dashboard) | `/studio`    | studio     | Studio dashboard                     | http://localhost:8082      |
| [supabase.com/docs](https://supabase.com/docs)           | `/apps/docs` | docs       | Guides and Reference (Next.js based) | http://localhost:3001/docs |

#### Running sites individually

You can run any of the sites individually by using the scope name. For example:

```sh
npm run dev:www
```

#### Shared components

The monorepo has a set of shared components under `/packages`:

- `/packages/common`: Common React code, shared between all sites.
- `/packages/config`: All shared config
- `/packages/spec`: Generates documentation using spec files.
- `/packages/tsconfig`: Shared Typescript settings

#### Installing packages

Installing a package with NPM workspaces requires you to add the `-w` flag to tell NPM which workspace you want to install into. Do not install dependencies in their local folder, install them from the route using the `-w` flag.

The format is: `npm install <package name> -w=<workspace to install in>`.

For example:

- `npm install react -w common`: installs into `./packages/common`
- `npm install react -w www`: installs into `./apps/www`
- `npm install react -w studio`: installs into `./studio`

You do not need to install `devDependencies` in each workspace. These can all be installed in the root package.

#### New Supabase docs

Following the changes to the [Supabase docs](https://supabase.com/blog/new-supabase-docs-built-with-nextjs) the following is needed to run the new docs locally:

- Inside of `apps/docs` create a `.env.local` file with the following: `NEXT_PUBLIC_NEW_DOCS=true`

Now when you run a local development docs server you will see the new docs site.

---

## Create a pull request

After making your changes, open a pull request (PR). Once you submit your pull request, others from the Supabase team/community will review it with you.

If you have an issue, like a merge conflict, or don't know how to open a pull request then check out [GitHub's pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests) tutorial on how to resolve merge conflicts and other issues. Once your PR has been merged, you will be proudly listed as a contributor in the [contributor chart](https://github.com/supabase/supabase/graphs/contributors).

---

## Common tasks

### Add a redirect

Create a new entry in the [`redirects.js`](https://github.com/supabase/supabase/blob/master/apps/www/lib/redirects.js) file in our main site.

---

### Federated docs

We support "federating" docs, meaning doc content can come directly from external repos other than [`supabase/supabase`](https://github.com/supabase/supabase).

- It's great for things like client libs who have their own set of docs that we don't want to duplicate on the official Supabase docs (eg. [`supabase/vecs`](https://github.com/supabase/vecs)).
- No duplication or manual steps required - fetches and generates automatically as part of the docs build pipeline
- It's flexible - you can "embed" external docs nearly anywhere at any level in Supabase docs, but they will feel native
- If you are maintaining a repo containing docs that you think could also live in Supabase docs, feel free to create an issue and we can work together to integrate

Federated docs work using Next.js's build pipeline. We use `getStaticProps()` to fetch remote documentation (ie. markdown) at build time which is processed and passed to the respective page within the docs.

See the [Vecs Python source code](https://github.com/supabase/supabase/blob/master/apps/docs/pages/guides/ai/python/%5Bslug%5D.tsx) to see how we do this for [`supabase/vecs`](https://github.com/supabase/vecs). Use this as a starting point for federating other docs.

Some things to consider:

- Links will often need to be transformed. For example if you are bringing in external markdown content, they may contain relative links that may not translate 1-to-1 after rendering in the Supabase docs. Use the [Link Transform](https://github.com/supabase/supabase/blob/master/apps/docs/lib/mdx/plugins/rehypeLinkTransform.ts) rehype plugin to transform links.
- External markdown may contain syntax extensions that Supabase docs don't understand by default (eg. [mkdocs-material extensions](https://squidfunk.github.io/mkdocs-material/setup/extensions/python-markdown)). We've built a few remark plugins to support these extensions (eg. [MkDocs Admonition](https://github.com/supabase/supabase/blob/master/apps/docs/lib/mdx/plugins/remarkAdmonition.ts)). If there is a markdown extension that you need that isn't built yet, feel free to open an issue and we can work together to create it.

---

## Community channels

If you are stuck somewhere or have any questions, join our [Discord Community Server](https://discord.supabase.com/) or the [Github Discussions](https://github.com/supabase/supabase/discussions). We are here to help!

## Contributors

<a href="https://github.com/supabase/supabase/graphs/contributors">
   <img src="https://contributors.deno.dev/supabase/supabase?height=1200&width=1200&count=90" width="1200" height="1200" alt="contributors">
</a>
