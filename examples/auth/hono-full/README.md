# Hono Supabase Auth Example

Based on the Hono/JSX + Vite example by [@MathurAditya724](https://github.com/MathurAditya724) \o/

This example shows how to use Supabase Auth both on the client and server side with Hono.

## Supabase setup

- Create a new Supabase project at [database.new](https://database.new/)
- Go to the `SQL Editor` and run the following query to create the `countries` table.

```sql
-- Create the table
create table countries (
  id bigint primary key generated always as identity,
  name text not null
);
-- Insert some sample data into the table
insert into countries (name)
values
  ('Canada'),
  ('United States'),
  ('Mexico');

alter table countries enable row level security;
```

- In a new query, create the following access policy.

```sql
create policy "authenticated users can read countries"
on public.countries
for select to authenticated
using (true);
```

- [Enable anonymous sign-ins](https://supabase.com/dashboard/project/_/auth/providers) in the Auth settings.

## Setup

- Run `npm install` to install the dependencies.
- Run `cp .env.example .env`.
- Set the required environment vairables in your `.env` file.

## Commands

Run the `vite` dev server

```bash
npm run dev
```

Building

```bash
npm run build
```

This project is configured to use `node` runtime, you can change it to your desired runtime in the `vite.config.js` file. We are using [@hono/vite-build](https://www.npmjs.com/package/@hono/vite-build) package for building the project and [@hono/vite-dev-server](https://www.npmjs.com/package/@hono/vite-dev-server) for running the dev server.
