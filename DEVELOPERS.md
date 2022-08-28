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

### Choose a directory

Choose if you want to work on the [Supabase Website](https://supabase.com), [Supabase Docs](https://supabase.com/docs), or [Supabase Studio](https://app.supabase.com).

1. Go to the [Supabase Website](https://supabase.com) directory

   ```sh
   cd apps/www
   ```

   Go to the [Supabase Docs](https://supabase.com/docs) directory

   ```sh
   cd apps/reference
   ```

   Go to the [Supabase Studio](https://app.supabase.com) directory

   ```sh
   cd studio
   ```

1. Install npm/yarn dependencies:

   npm

   ```sh
   npm install
   ```

   or with yarn

   ```sh
   yarn install
   ```

## Start a development server

To debug code and to see your changes in real time, it is often useful to have a local HTTP server. Click one of the three links below to choose which development server you want to start.

- [Supabase Website](#supabase-website)
- [Supabase Docs](#supabase-docs)
- [Supabase Studio](#supabase-studio)

### Supabase Website

The website is moving to a new monorepo setup. See the [Monorepo](#monorepo) section below.

### Supabase Docs

1. Build development server

   npm

   ```sh
   npm run build
   ```

   or with yarn

   ```sh
   yarn build
   ```

1. Start development server

   npm

   ```sh
   npm run start
   ```

   or with yarn

   ```sh
   yarn start
   ```

1. Access the local server in your web browser at http://localhost:3010/docs.

### Supabase Studio

1. Start development server

   npm

   ```sh
   npm run dev
   ```

   or with yarn

   ```sh
   yarn dev
   ```

1. Access the local server in your web browser at http://localhost:8082/.
See the [Supabase Studio readme](./studio/README.md) for more information.

## Create a pull request

After making your changes, open a pull request (PR). Once you submit your pull request, others from the Supabase team/community will review it with you.

Did you have an issue, like a merge conflict, or don't know how to open a pull request? Check out [GitHub's pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests) tutorial on how to resolve merge conflicts and other issues. Once your PR has been merged, you will be proudly listed as a contributor in the [contributor chart](https://github.com/supabase/supabase/graphs/contributors).

---

## Common tasks

### Add a redirect

Create a new entry in the [`next.config.js`](https://github.com/supabase/supabase/blob/master/apps/www/next.config.js) file in our main site.

## Monorepo

We are in the process of migrating this repository to monorepo, using Turborepo.
Eventually, the docs and the Studio will be run using Turborepo, which will significantly improve the developer workflow.
You must be using NPM 7 or higher.

### Getting started

```sh
npm install # install dependencies
npm run dev # start all the applications
```

Then edit and visit any of the following sites:

Site | Directory | Description | Local development server
---- | --------- | ----------- | ------------------------
[supabase.com](https://supabase.com) | `/apps/www` | The main website | http://localhost:3000
[supabase.com/docs](https://supabase.com/docs) | `apps/reference` | Guides and Reference documentaion | http://localhost:3010/docs
[POC] Community forum | `/apps/temp-community-forum` | GitHub Discussions in a Next.js site | http://localhost:3002
[POC] DEV articles site | `/apps/temp-community-tutorials` | A Next.js site for our DEV articles (which community members can write) | http://localhost:3003

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

You do not need to install `devDependencies` in each workspace. These can all be installed in the root package.

### Development

`npm run dev`

---

## Community channels

Stuck somewhere? Have any questions? Join the [Discord Community Server](https://discord.supabase.com/) or the [Github Discussions](https://github.com/supabase/supabase/discussions). We are here to help!
