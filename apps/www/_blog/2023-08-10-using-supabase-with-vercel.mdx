---
title: 'Vercel Integration and Next.js App Router Support'
description: 'Using Supabase with Vercel and Next.js is now a lot easier.'
launchweek: '8'
categories:
  - product
tags:
  - launch-week
  - integrations
date: '2023-08-10'
toc_depth: 3
author: jonny,jonmeyers_io
imgSocial: launch-week-8/day-4/vercel-and-supabase-og.jpg
imgThumb: launch-week-8/day-4/vercel-and-supabase-thumb.jpg
---

Vercel's open source framework, [Next.js](https://nextjs.org/), is the most popular frontend framework for Supabase developers.

At Supabase, we feel it's important to provide developers with the tools they need to build on the platforms they love. So for the past few months, we've doubled-down on the Vercel x Supabase experience. Here are a few of the newest improvements.

## The New Supabase x Vercel integration

Our new [Vercel Integration](https://vercel.com/integrations/supabase) streamlines the process of creating, deploying, and maintaining web applications.

### Monorepo support

You can now [link multiple](https://app.supabase.com/org/_/integrations) Vercel projects to a single Supabase project:

<Img
  src="/images/blog/launch-week-8/day-4/vercel-dashboard.png"
  alt="Vercel in the Supabase dashboard"
/>

Previously we mapped each Vercel project to a single Supabase project. With this release, we're introducing the concept of project 'Connections'. Supabase projects can have an unlimited number of Vercel Connections. This is especially useful for monorepos using [Turborepo](https://turbo.build/).

### Automatically managed Supabase config

We've improved the way we manage your Supabase environment variables.

<Img src="/images/blog/launch-week-8/day-4/vercel-config.png" alt="Vercel config" />

Supabase keeps each of your Vercel Projects updated with Environment Variables, managing your secrets (like `service-role-key`) and public variables (like `supabase-url`).

Importantly, Supabase now updates the Auth Redirect URIs to match your main Vercel project domain and any preview deployment URLs. We listen to your Vercel deployment webhooks and adjust your redirects accordingly.

<BlogCollapsible title="View the full list of environment variables">

    {/* prettier-ignore */}
    ```jsx
    POSTGRES_URL // URL of your Postgres database.
    POSTGRES_URL_NON_POOLING // URL of your Postgres database without pooling.
    POSTGRES_USER // Username for your Postgres database.
    POSTGRES_HOST // Host for your Postgres database.
    POSTGRES_PASSWORD // Password for your Postgres database.
    POSTGRES_DATABASE // Name of your Postgres database.
    SUPABASE_SERVICE_ROLE_KEY // Service role key for your Supabase project.
    SUPABASE_URL // URL for your Supabase project.
    SUPABASE_ANON_KEY // Anonymous key for your Supabase project.
    NEXT_PUBLIC_SUPABASE_URL // Publicly accessible URL for your Supabase project.
    NEXT_PUBLIC_SUPABASE_ANON_KEY // Publicly accessible anonymous key for your Supabase project.
    ```

    _We've used the same naming convention as Vercel Postgres to make it easy to migrate between platforms._

</BlogCollapsible>

### Starter kits

Don't have a project to work on yet? Not a problem, Supabase has a range of Starter kits. With the click of a button you can you have an full-stack application running in less than a minute.

You can find a Vercel Starter kit by looking for Vercel's blue "Deploy Button". Clicking on any one of these buttons will:

1. Take you to Vercel to clone the repository to your own GitHub account/organization
2. Auto install the Supabase Integration (if not already done so).
3. Then we make things really easy: Supabase checks for any migrations in the Starter kit, and if so, we'll run them in your new Supabase project.

After Vercel has deployed the app, it works without any additional configuration. Starter kits include everything from table schemas, authentication, and sample data from the `seed.sql` file.

### Database Branching

We announced Database Branching on [Tuesday](/blog/supabase-local-dev#branching-and-preview-environments). We've designed this to work perfectly with Vercel's Preview Deployments.

<Img src="/images/blog/launch-week-8/day-4/supabase-vercel-branching.png" alt="Vercel branching" />

For now, Branching in Supabase is limited to development partners. We'll be rolling it out to everyone over the coming months. If you're interested in testing the new features, [sign up for early access](https://forms.supabase.com/branching-request).

## Next.js 13 App Router Support

The new App Router in Next.js adds a lot of exciting features, like React Suspense and Streaming. Supabase now fully-supports the App Router in Next.js:

<div className="video-container">
  <iframe
    className="w-full"
    src="https://www.youtube-nocookie.com/embed/w3LD0Z73vgU"
    title="YouTube video player"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>
</div>

The Next.js App Router shifts a significant amount of your app development from the client to the server, using Server Components, Route Handlers and Server Actions. This means Supabase Auth needs to be configured to store session data in cookies - available in the browser and on the server - rather than Local Storage. We've simplified this process for you with our new [Next.js Auth Helpers package](https://supabase.com/docs/guides/auth/auth-helpers/nextjs).

This configures cookie-based Auth, making the user's session available throughout the entire Next.js App Router stack:

- [Client Components](/docs/guides/auth/auth-helpers/nextjs#client-components) — `createClientComponentClient`
- [Server Components](/docs/guides/auth/auth-helpers/nextjs#server-components) — `createServerComponentClient`
- [Server Actions](/docs/guides/auth/auth-helpers/nextjs#server-actions) — `createServerActionClient`
- [Route Handlers](/docs/guides/auth/auth-helpers/nextjs#route-handlers) — `createRouteHandlerClient`
- [Middleware](/docs/guides/auth/auth-helpers/nextjs#middleware) — `createMiddlewareClient`

## Scaffolding a new Next.js app with Supabase

[create-next-app](https://nextjs.org/docs/pages/api-reference/create-next-app) is one of the easiest way to get started with Next.js.

We've created a new template for `create-next-app` scaffolding Supabase projects:

```sh
npx create-next-app -e with-supabase
```

This creates a new Next.js app configured with:

- Server-side cookie-based Auth
- TypeScript
- Tailwind CSS

This is the perfect starting point for any application built with Next.js and Supabase! 🚀

Check out the [`/app/_examples`](https://github.com/vercel/next.js/blob/canary/examples/with-supabase/app/_examples) folder for an example of creating a Supabase client in:

- [Client Components](https://github.com/vercel/next.js/blob/canary/examples/with-supabase/app/_examples/client-component/page.tsx)
- [Server Components](https://github.com/vercel/next.js/blob/canary/examples/with-supabase/app/_examples/server-component/page.tsx)
- [Route Handlers](https://github.com/vercel/next.js/blob/canary/examples/with-supabase/app/_examples/route-handler/route.ts)
- [Server Actions](https://github.com/vercel/next.js/blob/canary/examples/with-supabase/app/_examples/server-action/page.tsx)

## More integrations

We've got plenty more in store for Next.js developers which we will be rolling out over the next few months. If you're looking for more integrations, or you want to build your own, we're also launching a new Supabase [Integrations Marketplace](/blog/supabase-integrations-marketplace).

## More Launch Week 8

- [Supabase Local Dev: migrations, branching, and observability](/blog/supabase-local-dev)
- [Hugging Face is now supported in Supabase](/blog/hugging-face-supabase)
- [Launch Week 8](/launch-week)
- [Coding the stars - an interactive constellation with Three.js and React Three Fiber](/blog/interactive-constellation-threejs-react-three-fiber)
- [Why we'll stay remote](/blog/why-supabase-remote)
- [Postgres Language Server](https://github.com/supabase/postgres_lsp)
