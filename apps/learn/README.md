Plan:
Course 1: Supabase Foundations Learn the basics of Supabase: database, auth, and RLS. 5 chapters.

-

Course 2: Project: Smart Office 15 Build a realtime room-booking dashboard using Supabase. 15 chapters.
Course 3: Supabase Internals: Performance & Scaling. Learn how to profile queries, tune indexes, and scale Postgres with Supabase. 20 chapters.
Course 4: Supabase Internals: Debugging & Operations. Understand how to diagnose slow queries, use read replicas, and manage production workloads. 20 chapters.

———
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Supabase types

To regenerate the Supabase database types, run

```
supabase gen types --local > registry/default/fixtures/database.types.ts
```
