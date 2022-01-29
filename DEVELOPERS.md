# Developing Supabase

* [Development Setup](##Development-Setup)
* [Installing Dependencies](###Installing-Dependencies)
* [Building Supabase](##Building-Supabase)
* [Start a Development Server](##Start-a-Development-Server)
* [What's Next?](##What's-Next)
* [Community Channels](##Community-Channels)

## Development Setup

First off, thanks for your interest in Supabase and for wanting to contribute!

Before you begin, read the [code of conduct](https://github.com/supabase/.github/blob/main/CODE_OF_CONDUCT.md) and check out the [existing issues](https://github.com/supabase/supabase/issues).

This document describes how to set up your development environment to build and test Supabase.

### Installing Dependencies

Before you can build Supabase, you must install and configure the following dependencies on your
machine:

* [Git](http://git-scm.com/)

* [Node.js v16.x (LTS)](http://nodejs.org)

* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Forking Supabase on Github

To contribute code to Supabase, you must fork the [Supabase Repository](https://github.com/supabase/supabase). After you fork the repository, you may now begin editing the source code.

## Building Supabase

To build Supabase, you clone the source code repository:

2. Clone your Github forked repository:
   ```sh
   git clone https://github.com/<github_username>/supabase.git
   ```

3. Go to the Supabase directory:
   ```sh
   cd supabase
   ```

### Choosing Directory

Before you start a development server, you must choose if you want to work on the [Supabase Website](https://supabase.com), [Supabase Docs](https://supabase.com/docs/), or [Supabase Studio](https://app.supabase.io).

1. Go to the [Supabase Website](https://supabase.com) directory
    ```sh
    cd www
    ```
    Go to the [Supabase Docs](https://supabase.com/docs/) directory
    ```sh
    cd web
    ```
    Go to the [Supabase Studio](https://app.supabase.io) directory
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

- [Supabase Website](###Supabase-Website-Development-Server)
- [Supabase Docs](###Supabase-Docs-Development-Server)
- [Supabase Studio](###Supabase-Studio-Development-Server)

### Supabase Website Development Server

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
    http://localhost:3000/
    ```

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

## What's Next?

Make your changes to the file(s) you'd like to update.

### Open a pull request

When you're done making changes and you'd like to propose them for review by opening a pull request.

### Submit your PR & get it reviewed

- Once you submit your PR, others from the Unleash community will review it with you. The first thing you're going to want to do is a self review.
- After that, we may have questions, check back on your PR to keep up with the conversation.
- Did you have an issue, like a merge conflict? Check out GitHub's git tutorial on how to resolve merge conflicts and other issues.

### Your PR is merged!

Congratulations! The whole Supabase community thanks you 🙏🏼

Once your PR is merged, you will be proudly listed as a contributor in the [contributor chart](https://github.com/supabase/supabase/graphs/contributors).

## Community Channels

Stuck somewhere? Have any questions? please join the [Discord Community Server](https://discord.supabase.com/) or the [Github Discussions](https://discord.supabase.com/). We are here to help!
