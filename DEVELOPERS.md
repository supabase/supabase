# Developing Supabase

- [Developing Supabase](#developing-supabase)

  - [Getting started](#getting-started)
    - [Install dependencies](#install-dependencies)
  - [Local development](#local-development)
    - [Fork the repo](#fork-the-repo)
    - [Clone the repo](#clone-the-repo)
    - [Install dependencies](#install-dependencies-1)
      - [Running sites individually](#running-sites-individually)
      - [Shared components](#shared-components)
      - [Installing packages](#installing-packages)
  - [Running Docker for Supabase Studio](#running-docker-for-supabase-studio)
    - [Prerequisites](#prerequisites)
    - [Get Started](#get-started)
  - [Create a pull request](#create-a-pull-request)
  - [Issue assignment](#issue-assignment)
  - [Common tasks](#common-tasks)
    - [Add a redirect](#add-a-redirect)
    - [Federated docs](#federated-docs)
  - [Community channels](#community-channels)
  - [Contributors](#contributors)

- [Community channels](#community-channels)

## Getting started

Thank you for your interest in [Supabase](https://supabase.com) and your willingness to contribute!

To ensure a positive and inclusive environment, please read our [code of conduct](https://github.com/supabase/.github/blob/main/CODE_OF_CONDUCT.md). We encourage you to explore the existing [issues](https://github.com/supabase/supabase/issues) to see how you can make a meaningful impact. This document will help you setup your development environment.

### Install dependencies

You will need to install and configure the following dependencies on your machine to build [Supabase](https://supabase.com):

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org) version as documented in [.nvmrc](./.nvmrc)
- [pnpm](https://pnpm.io/) version 9.x.x or higher
- [make](https://www.gnu.org/software/make/) or the equivalent to `build-essentials` for your OS
- [Docker](https://docs.docker.com/get-docker/) (to run studio locally)

## Local development

This repo uses [Turborepo](https://turborepo.org/docs).

All of our apps are in this [Turborepo](https://turborepo.org/docs), which make it easy to share packages and config between projects.

### Fork the repo

To contribute code to [Supabase](https://supabase.com), you must fork the [Supabase repo](https://github.com/supabase/supabase).

### Clone the repo

1. Clone your GitHub forked repo:

   ```sh
   git clone https://github.com/<github_username>/supabase.git
   ```

2. Go to the Supabase directory:
   ```sh
   cd supabase
   ```

### Install dependencies

1. Install the dependencies in the root of the repo:

   ```sh
   pnpm install # install dependencies
   ```

2. Copy the example `.env.local.example` to `.env.local`

   ```sh
   cp apps/www/.env.local.example apps/www/.env.local
   ```

3. After that you can run the apps simultaneously with the following:
   ```sh
   pnpm dev # start all the applications
   ```

Then visit, and edit, any of the following sites:

| Site                                                     | Directory      | Scope name | Description                                   | Local development server   |
| -------------------------------------------------------- | -------------- | ---------- | --------------------------------------------- | -------------------------- |
| [supabase.com](https://supabase.com)                     | `/apps/www`    | www        | The main website                              | http://localhost:3000      |
| [supabase.com/dashboard](https://supabase.com/dashboard) | `/apps/studio` | studio     | Studio dashboard (requires Docker, see below) | http://localhost:8082      |
| [supabase.com/docs](https://supabase.com/docs)           | `/apps/docs`   | docs       | Guides and Reference (Next.js based)          | http://localhost:3001/docs |

#### Running sites individually

You can run any of the sites individually by using the scope name. For example:

```sh
pnpm dev:www
```

Note: Particularly for `www` make sure you have copied `apps/www/.env.local.example` to `apps/www/.env.local`

#### Shared components

The monorepo has a set of shared components under `/packages`:

- `/packages/ai-commands`: Helpers/Commands for AI related functions
- `/packages/common`: Common React components, shared between all sites
- `/packages/config`: All shared config
- `/packages/shared-data`: Shared data that can be used across all apps
- `/packages/tsconfig`: Shared Typescript settings
- `/packages/ui`: Common UI components

#### Installing packages

Installing a package in a specific workspace requires you to move to the workspace and then run the install command.

For example:

1. `cd apps/studio`: move to the `studio` workspace.
2. `pnpm add react`: installs `react` into `studio` workspace.


---

## Running Docker for Supabase Studio

To run Studio locally, you'll need to setup Docker in addition to your NextJS frontend.

#### Prerequisites

First, make sure you have the Docker installed on your device. You can download and install it from [here](https://docs.docker.com/get-docker/).

#### Get Started

1. Navigate to the `docker` directory in your forked repo

   ```sh
   cd docker
   ```

2. Copy the example `env` file

   ```sh
   cp .env.example .env
   ```

3. Run docker:

   ```sh
   docker compose up
   ```

This command initializes the containers specified in the `docker-compose.yml` file. It might take a few moments to complete, depending on your computer and internet connection.

Once the `docker compose up` process completes, you should have your local version of Supabase up and running within Docker containers. You can access it at `http://localhost:8082`.

Remember to keep the Docker application open as long as you're working with your local Supabase instance.

## Create a pull request

After making any changes, open a pull request. Once you submit your pull request, the Supabase team will review it with you.

Once your PR has been merged, you will be proudly listed as a contributor in the [contributor chart](https://github.com/supabase/supabase/graphs/contributors)!

## Issue assignment

We don't have a process for assigning issues to contributors. Please feel free to jump into any issues in this repo that you are able to help with. Our intention is to encourage anyone to help without feeling burdened by an assigned task. Life can sometimes get in the way, and we don't want to leave contributors feeling obligated to complete issues when they may have limited time or unexpected commitments.

We also recognize that not having a process can sometimes lead to competing or duplicate PRs. There's no perfect solution here. We encourage you to communicate early and often on an Issue to indicate that you're actively working on it. If you see that an Issue already has a PR, try working with that author instead of drafting your own.

We review PRs in the order of their submission. We try to accept the earliest one that is closest to being ready to merge.

---

## Common tasks

### Add a redirect

Create a new entry in the [`redirects.js`](https://github.com/supabase/supabase/blob/master/apps/www/lib/redirects.js) file in our main site.

---

### Federated docs

We support "federating" docs, meaning doc content can come directly from external repos other than [`supabase/supabase`](https://github.com/supabase/supabase).

- It's great for things like client libs who have their own set of docs that we don't want to duplicate on the official Supabase docs (eg. [`supabase/vecs`](https://github.com/supabase/vecs)).
- No duplication or manual steps required - fetches and generates automatically as part of the docs build pipeline.
- It's flexible - you can "embed" external docs nearly anywhere at any level in Supabase docs, but they will feel native.
- If you are maintaining a repo containing docs that you think could also live in Supabase docs, feel free to create an issue and we can work together to integrate.

Federated docs work using Next.js's build pipeline. We use `getStaticProps()` to fetch remote documentation (ie. markdown) at build time which is processed and passed to the respective page within the docs.

See the [Vecs Python source code](https://github.com/supabase/supabase/tree/master/apps/docs/app/guides/ai/python/%5Bslug%5D to see how we do this for [`supabase/vecs`](https://github.com/supabase/vecs). Use this as a starting point for federating other docs.

Some things to consider:

- Links will often need to be transformed. For example if you are bringing in external markdown content, they may contain relative links that may not translate 1-to-1 after rendering in the Supabase docs. Use the [Link Transform](https://github.com/supabase/supabase/blob/master/apps/docs/lib/mdx/plugins/rehypeLinkTransform.ts) rehype plugin to transform links.
- External markdown may contain syntax extensions that Supabase docs don't understand by default (eg. [mkdocs-material extensions](https://squidfunk.github.io/mkdocs-material/setup/extensions/python-markdown)). We've built a few remark plugins to support these extensions (eg. [MkDocs Admonition](https://github.com/supabase/supabase/blob/master/apps/docs/lib/mdx/plugins/remarkAdmonition.ts)). If there is a markdown extension that you need that isn't built yet, feel free to open an issue and we can work together to create it.

---

## Community channels

If you get stuck somewhere or have any questions, join our [Discord Community Server](https://discord.supabase.com/) or the [GitHub Discussions](https://github.com/supabase/supabase/discussions). We are here to help!

## Contributors

<a href="https://github.com/supabase/supabase/graphs/contributors">
   <img src="https://contributors.deno.dev/supabase/supabase?height=1200&width=1200&count=90" width="1200" height="1200" alt="contributors">
</a>
