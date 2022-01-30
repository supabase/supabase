# Developing Supabase

* [Development Setup](#Development-Setup)
* [Installing Dependencies](#Installing-Dependencies)
* [Building Supabase](#Building-Supabase)
* [Start a Development Server](#Start-a-Development-Server)
* [Build in Public](#Build-in-Public)

## Development Setup

This document describes how to set up your development environment to build and test Supabase.

### Installing Dependencies

Before you can build Supabase, you must install and configure the following dependencies on your
machine:

* [Git](http://git-scm.com/)

* [Node.js v16.x (LTS)](http://nodejs.org)

* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

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

- [Supabase Website](#Supabase-Website-Development-Server)
- [Supabase Docs](#Supabase-Docs-Development-Server)
- [Supabase Studio](#Supabase-Studio-Development-Server)

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

For more information on Supabase Studio, see the [Supabase Studio readme](./studio/README.md).

## Build in Public

Videos of building supabase made in public.

- [Contributing to open source as  a beginner - Supabase](https://youtu.be/OAqhsylUuWg) - [@imskr](https://github.com/imskr)
