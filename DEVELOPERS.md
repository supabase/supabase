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

Thanks for your interest in [Supabase](https://supabase.com) and for wanting to contribute! Before you begin, read the
[code of conduct](https://github.com/supabase/.github/blob/main/CODE_OF_CONDUCT.md) and check out the
[existing issues](https://github.com/supabase/supabase/issues).
This document describes how to set up your development environment to build and test [Supabase](https://supabase.com).

### Install dependencies

You need to install and configure the following dependencies on your machine to build [Supabase](https://supabase.com):

- [Git](http://git-scm.com/)
- [Node.js v16.x (LTS)](http://nodejs.org)
- [npm](https://www.npmjs.com/) version 7+ or [Yarn](https://yarnpkg.com/)

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

1. Go to the Supabase directory:
   ```sh
   cd supabase
   ```

### Running turborepo

[Supabase](https://supabase.com) uses [Turborepo](https://turborepo.org/docs) to manage and run this monorepo.

1. Install the dependences in the root of the repo.

   ```sh
   npm install # install dependencies
   ```

2. You can then run the apps simultaneously with the following.
   ```sh
   npm run dev # start all the applications
   ```

Then visit, and edit, any of the following sites:

| Site                                           | Directory    | Scope name | Description                          | Local development server   |
| ---------------------------------------------- | ------------ | ---------- | ------------------------------------ | -------------------------- |
| [supabase.com](https://supabase.com)           | `/apps/www`  | www        | The main website                     | http://localhost:3000      |
| [app.supabase.com](https://app.supabase.com)   | `/studio`    | studio     | Studio dashboard                     | http://localhost:8082      |
| [supabase.com/docs](https://supabase.com/docs) | `/apps/docs` | docs       | Guides and Reference (Next.js based) | http://localhost:3001/docs |

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

Now when you run a local devlopment docs server you will see the new docs site.

---

## Create a pull request

After making your changes, open a pull request (PR). Once you submit your pull request, others from the Supabase team/community will review it with you.

Did you have an issue, like a merge conflict, or don't know how to open a pull request? Check out [GitHub's pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests) tutorial on how to resolve merge conflicts and other issues. Once your PR has been merged, you will be proudly listed as a contributor in the [contributor chart](https://github.com/supabase/supabase/graphs/contributors).

---

## Common tasks

### Add a redirect

Create a new entry in the [`redirects.js`](https://github.com/supabase/supabase/blob/master/apps/www/lib/redirects.js) file in our main site.

---

## Community channels

Stuck somewhere? Have any questions? Join the [Discord Community Server](https://discord.supabase.com/) or the [Github Discussions](https://github.com/supabase/supabase/discussions). We are here to help!
