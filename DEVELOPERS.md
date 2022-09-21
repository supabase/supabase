# Developing Supabase

1. [Development setup](#development-setup)
    - [Install dependencies](#install-dependencies)
    - [Fork the repository](#fork-the-repository)
1. [Build Supabase](#build-supabase)
    - [Choose a directory](#choose-a-directory)
1. [Start a development server](#start-a-development-server)
    - [Supabase Website](#supabase-website)
    - [Supabase Docs](#supabase-docs)
    - [Supabase Studio](#supabase-studio)
1. [Create a pull request](#create-a-pull-request)

- [Common tasks](#common-tasks)
  - [Add a redirect](#add-a-redirect)
- [Monorepo](#monorepo)
  - [Getting started](#getting-started)
  - [Shared components](#shared-components)
  - [Installing packages](#installing-packages)
  - [Development](#development)
- [Community channels](#community-channels)

## Development setup

Thanks for your interest in Supabase and for wanting to contribute! Before you begin, read the
[code of conduct](https://github.com/supabase/.github/blob/main/CODE_OF_CONDUCT.md) and check out the
[existing issues](https://github.com/supabase/supabase/issues).
This document describes how to set up your development environment to build and test Supabase.

### Install dependencies

You need to install and configure the following dependencies on your machine to build Supabase:

- [Git](http://git-scm.com/)
- [Node.js v16.x (LTS)](http://nodejs.org)
- [npm](https://www.npmjs.com/) version 7+ or [Yarn](https://yarnpkg.com/)

### Fork the repository

To contribute code to Supabase, you must fork the [Supabase Repository](https://github.com/supabase/supabase).

## Build Supabase

1. Clone your GitHub forked repository:

   ```sh
   git clone https://github.com/<github_username>/supabase.git
   ```

1. Go to the Supabase directory:
   ```sh
   cd supabase
   ```

## Getting started

We are in the process of migrating this repository to monorepo, using Turborepo.
Eventually, the docs and the Studio will be run using Turborepo, which will significantly improve the developer workflow.
You must be using NPM 7 or higher.

```sh
npm install # install dependencies
npm run dev # start all the applications
```

Then edit and visit any of the following sites:

Site | Directory | Scope name | Description | Local development server
---- | --------- | ---------- | ----------- | ------------------------
[supabase.com](https://supabase.com) | `/apps/www` | www | The main website | http://localhost:3000
[app.supabase.com](https://app.supabase.com) | `/studio` | studio | Studio dashboard | http://localhost:8082
[POC] Next.js based Docs site | `/apps/temp-docs` | temp-docs | Temp Docs Site (Next.js) | http://localhost:3001  
[POC] Community forum | `/apps/temp-community-forum` | forum | GitHub Discussions in a Next.js site | http://localhost:3002
[POC] DEV articles site | `/apps/temp-community-tutorials` | tutorials | A Next.js site for our DEV articles (which community members can write) | http://localhost:3003

The following sites are not using turbo repo, and must be run independently.

Site | Directory | Scope name | Description | Local development server
---- | --------- | ---------- | ----------- | ------------------------ 
[supabase.com/docs](https://supabase.com/docs) | `/apps/reference` | N/A | Guides and Reference (Currently not in Turborepo) | http://localhost:3010/docs

### Shared components

The monorepo has a set of shared components under `/packages`:

- `/packages/common`: Common React code, shared between all sites.
- `/packages/config`: All shared config
- `/packages/spec`: Generates documentation using spec files.
- `/packages/tsconfig`: Shared Typescript settings

### Installing packages

Installing a package with NPM workspaces requires you to add the `-w` flag to tell NPM which workspace you want to install into.

The format is: `npm install <package name> -w=<workspace to install in>`.

For example:

- `npm install @supabase/ui -w common`: installs into `./packages/common`
- `npm install @supabase/ui -w www`: installs into `./apps/www`
- `npm install @supabase/ui -w studio`: installs into `./studio`

You do not need to install `devDependencies` in each workspace. These can all be installed in the root package.

### Development

In the root of the repo, run:

```bash
npm run dev
```

## Create a pull request

After making your changes, open a pull request (PR). Once you submit your pull request, others from the Supabase team/community will review it with you.

Did you have an issue, like a merge conflict, or don't know how to open a pull request? Check out [GitHub's pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests) tutorial on how to resolve merge conflicts and other issues. Once your PR has been merged, you will be proudly listed as a contributor in the [contributor chart](https://github.com/supabase/supabase/graphs/contributors).


---

## Common tasks

### Add a redirect

Create a new entry in the [`next.config.js`](https://github.com/supabase/supabase/blob/master/apps/www/next.config.js) file in our main site.

---

## Community channels

Stuck somewhere? Have any questions? Join the [Discord Community Server](https://discord.supabase.com/) or the [Github Discussions](https://github.com/supabase/supabase/discussions). We are here to help!
