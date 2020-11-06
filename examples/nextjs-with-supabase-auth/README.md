# Example: Supabase authentication client- and server-side (API routes)

This example shows how to use Supabase auth both on the client (`useUser` hook) and server in [API routes](https://nextjs.org/docs/api-routes/introduction).

## Demo

- See it in action on [CodeSandbox](https://codesandbox.io/s/github/thorwebdev/nextjs-with-supabase-auth).

## How to use

Execute [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) with [Yarn](https://yarnpkg.com/lang/en/docs/cli/create/) or [npx](https://github.com/zkat/npx#readme) to bootstrap the example:

```bash
npx create-next-app --example https://github.com/supabase/supabase/tree/master/examples/with-supabase-auth with-supabase-auth-app
# or
yarn create next-app --example https://github.com/supabase/supabase/tree/master/examples/with-supabase-auth with-supabase-auth-app
```

## Configuration

### 1. Create new project

Sign up to Supabase - [https://app.supabase.io](https://app.supabase.io) and create a new project. Wait for your database to start.

### 2. Get the URL and Key

Create a copy of `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Go to the Project Settings (the cog icon), open the API tab, and find your API URL and `anon` key and set them in your newly created `.env.local` file.

#### [Optional] - Set up OAuth providers

You can use third-party login providers like GitHub or Google. Refer to the [docs](https://supabase.io/docs/guides/auth#third-party-logins) to learn how to configure these.

### 3. Install and run

```bash
npm install
npm run dev
# or
yarn
yarn dev
```

### 4. Deploy with Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/git?s=https%3A%2F%2Fgithub.com%2Fsupabase%2Fsupabase%2Ftree%2Fmaster%2Fexamples%2Fnextjs-with-supabase-auth&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_KEY&envDescription=Find%20the%20Supabase%20URL%20and%20key%20in%20your%20auto-generated%20docs%20at%20app.supabase.io&project-name=nextjs-with-supabase-auth&repo-name=nextjs-with-supabase-auth)

You will be asked for the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_KEY` from step 2 above.

After deploying, copy the deployment URL and navigate to your Supabase project settings (Authentication > Settings) and set your site url.
