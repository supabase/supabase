# Developing Supabase Docs

1. [Development setup](#development-setup)
   - [Install dependencies](#install-dependencies)
   - [Fork the repository](#fork-the-repository)
2. [Build Supabase](#build-supabase)
   - [Run the docs locally](#run-the-docs-locally)
   - [Editing files](#editing-files)
3. [Create a pull request](#create-a-pull-request)

- [Monorepo](#monorepo)
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

### Run the docs locally

1. Build the development server

   npm

   ```sh
   npm run build
   ```

   or with yarn

   ```sh
   yarn build
   ```

1. Start the development server

   npm

   ```sh
   npm run start
   ```

   or with yarn

   ```sh
   yarn start
   ```

1. Access the local server in your web browser at http://localhost:3010/docs.

---

### Editing files

Our docs site are comprised of guides, tutorials, quickstarts, and reference docs. Note that the [reference docs](https://supabase.com/docs/reference) are generated from spec files.

If you go to any page in the [Supabase docs](https://supabase.com/docs), you'll see an **Edit this page** link at the bottom. This link indicates which file you need to edit.

For example, the [NextJS Quickstart](https://supabase.com/docs/guides/with-nextjs) is a markdown file you can edit directly. However, this [signUp() reference doc](https://supabase.com/docs/reference/javascript/auth-signup) is generated from a [spec file](https://github.com/supabase/supabase/edit/master/spec/supabase_js_v1_legacy.yml).

## Create a pull request

After making your changes, open a pull request (PR). Once you submit your pull request, others from the Supabase team/community will review it with you.

Did you have an issue, like a merge conflict, or don't know how to open a pull request? Check out [GitHub's pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests) tutorial on how to resolve merge conflicts and other issues. Once your PR has been merged, you will be proudly listed as a contributor in the [contributor chart](https://github.com/supabase/supabase/graphs/contributors).

---

## Monorepo

We are in the process of migrating this repository to monorepo, using Turborepo.
This app is currently not in that workflow, but if you want to contribute to any of the other apps, please refer to [the developers readme](https://github.com/supabase/supabase/blob/master/DEVELOPERS.md).

---

## Community channels

Stuck somewhere? Have any questions? Join the [Discord Community Server](https://discord.supabase.com/) or the [Github Discussions](https://github.com/supabase/supabase/discussions). We are here to help!
