# Sveltejs todo with TailwindCSS - Snowpack, Backend Supabase

## Deploy your own

### 1. Create new project

Sign up to Supabase - [https://app.supabase.io](https://app.supabase.io) and create a new project. Wait for your database to start.

## 2. configure .env

```
cat <<EOF >>.env
SNOWPACK_PUBLIC_SUPABASE_URL=https://yoururl.supabase.io
SNOWPACK_PUBLIC_SUPABASE_KEY=your-anon-key
EOF
```

## 3. create db

run db/task_list_schema.sql

## 4. test you have DB

Run with your service key (not the anon key)

`make test-db`

## 5. Create a user

add to .env temporary user and password

```
cat <<EOF >>.env
SNOWPACK_PUBLIC_PASSWORD=
SNOWPACK_PUBLIC_USER=email@zyx.com
EOF
```

`make signup`

## 6. Login as that user

`$ make login`

### 7. Deploy the SvelteJS client

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fsupabase%2Fsupabase%2Ftree%2Fmaster%2Fexamples%2Fsveltejs-todo&env=SNOWPACK_PUBLIC_SUPABASE_URL,SNOWPACK_PUBLIC_SUPABASE_KEY&envDescription=Find%20the%20Supabase%20URL%20and%20key%20in%20the%20your%20auto-generated%20docs%20at%20app.supabase.io&project-name=supabase-sveltejs-todo&repo-name=supabase-sveltejs-todo)

You will be asked for a `SNOWPACK__PUBLIC_SUPABASE_URL` and `SNOWPACK__PUBLIC_SUPABASE_KEY`. Use the API URL and `anon` key from [step 2](#2.-configure-.env).

> ✨ Bootstrapped with Create Snowpack App (CSA).

## Available Scripts

### npm start

Runs the app in the development mode.
Open http://localhost:8080 to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

### npm test

Launches the test runner in the interactive watch mode.
See the section about running tests for more information.

### npm run build

Builds a static copy of your site to the `build/` folder.
Your app is ready to be deployed!

**For the best production performance:** Add a build bundler plugin like "@snowpack/plugin-webpack" or "@snowpack/plugin-parcel" to your `snowpack.config.json` config file.

### Q: What about Eject?

No eject needed! Snowpack guarantees zero lock-in, and CSA strives for the same.
