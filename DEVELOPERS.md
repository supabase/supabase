# Developing Supabase

- [Development Setup](#development-setup)
  - [Installing Dependencies](#installing-dependencies)
  - [Forking Supabase on GitHub](#forking-supabase-on-github)
- [Building Supabase](#building-supabase)
  - [Choosing Directory](#choosing-directory)
- [Start a Development Server](#start-a-development-server)
  - [Supabase Website Development Server](#supabase-website-development-server)
  - [Supabase Docs Development Server](#supabase-docs-development-server)
  - [Supabase Studio Development Server](#supabase-studio-development-server)
- [Monorepo](#monorepo)
  - [Getting started](#getting-started)
  - [Shared components](#shared-components)
  - [Installing packages](#installing-packages)
  - [Development](#development)
- [Finally](#finally)
- [Community Channels](#community-channels)

## Development Setup

First off, thanks for your interest in Supabase and for wanting to contribute! before you begin, read the
[code of conduct](https://github.com/supabase/.github/blob/main/CODE_OF_CONDUCT.md) and check out the
[existing issues](https://github.com/supabase/supabase/issues).
This document describes how to set up your development environment to build and test Supabase.

### Installing Dependencies

Before you can build Supabase, you must install and configure the following dependencies on your
machine:

- [Git](http://git-scm.com/)

- [Node.js v16.x (LTS)](http://nodejs.org)

- [npm](https://www.npmjs.com/) version 7+.

### Forking Supabase on GitHub

To contribute code to Supabase, you must fork the [Supabase Repository](https://github.com/supabase/supabase). After you fork the repository, you may now begin editing the source code.

## Building Supabase

To build Supabase, you clone the source code repository:

2. Clone your GitHub forked repository:

   ```sh
   git clone https://github.com/<github_username>/supabase.git
   ```

3. Go to the Supabase directory:
   ```sh
   cd supabase
   ```

### Choosing Directory

Before you start a development server, you must choose if you want to work on the [Supabase Website](https://supabase.com), [Supabase Docs](https://supabase.com/docs), or [Supabase Studio](https://app.supabase.com).

1. Go to the [Supabase Website](https://supabase.com) directory

   ```sh
   cd apps/www
   ```

   Go to the [Supabase Docs](https://supabase.com/docs) directory

   ```sh
   cd web
   ```

   Go to the [Supabase Studio](https://app.supabase.com) directory

   ```sh
   cd studio
   ```

2. Install npm dependencies:

   npm

   ```sh
   npm install
   ```

   or with yarn

   ```sh
   yarn install
   ```

## Start a Development Server

To debug code, and to see changes in real time, it is often useful to have a local HTTP server. Click one of the three links below to choose which development server you want to start.

- [Supabase Website](#Supabase-Website-Development-Server)
- [Supabase Docs](#Supabase-Docs-Development-Server)
- [Supabase Studio](#Supabase-Studio-Development-Server)

### Supabase Website Development Server

The website is moving to a new monorepo setup. See the [Monorepo](#monorepo) section below.

### Supabase Docs Development Server

1. Build development server

   npm

   ```sh
   npm run build
   ```

   or with yarn

   ```sh
   yarn build
   ```

2. Start development server

   npm

   ```sh
   npm run start
   ```

   or with yarn

   ```sh
   yarn start
   ```

3. To access the local server, enter the following URL into your web browser:

   ```sh
   http://localhost:3005/docs
   ```

### Supabase Studio Development Server

1. Start development server

   npm

   ```sh
   npm run dev
   ```

   or with yarn

   ```sh
   yarn dev
   ```

2. To access the local server, enter the following URL into your web browser:

   ```sh
   http://localhost:8082/
   ```

For more information on Supabase Studio, see the [Supabase Studio readme](./studio/README.md).

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

- `/apps/www`: http://localhost:3000
  - The main website.
- `/apps/temp-docs`: http://localhost:3001
  - We are migrating the docs to a Next.js application.
- `/apps/temp-community-forum`: http://localhost:3002
  - pulls all our github discussions into a nextjs site. Temporary/POC
- `/apps/temp-community-tutorials`: http://localhost:3003
  - pulls all our DEV articles (which community members can write) into a nextjs site. Temporary/POC

### Shared components

The monorepo has a set of shared components under `/packages`:

- `/packages/common`: Common React code, shared between all sites.
- `/packages/config`: All shared config
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

## Finally

After making your changes to the file(s) you'd like to update, it's time to open a pull request. Once you submit your pull request, others from the Supabase team/community will review it with you.

Did you have an issue, like a merge conflict, or don't know how to open a pull request? Check out [GitHub's pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests) tutorial on how to resolve merge conflicts and other issues. Once your PR has been merged, you will be proudly listed as a contributor in the [contributor chart](https://github.com/supabase/supabase/graphs/contributors)

## Community Channels

Stuck somewhere? Have any questions? please join the [Discord Community Server](https://discord.supabase.com/) or the [Github Discussions](https://github.com/supabase/supabase/discussions). We are here to help!
