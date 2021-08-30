# Supabase Studio

Self hosted UI for Supabase projects.

## Status

- [x] POC: Under heavy development
- [ ] Alpha: Ready for testing
- [ ] Beta: Stable
- [ ] Public: Production ready

Warning: this is a work in progress. You can watch the development here:

- Episode 1: https://www.youtube.com/watch?v=LHYrqBb4q9I
- Episode 2: https://www.youtube.com/watch?v=R4gJhX_JFTo

### Built with

- [Next.js](https://nextjs.org/)
- [Tailwind](https://tailwindcss.com/)
- [Supabase UI](https://ui.supabase.io/)

### Run locally

Run Supabase

```bash
cd ..
cd docker
docker-compose up
```

Run this repo

```bash
# Add your API URL and KEY as environment variables
# You can find you API params at app.supabase.io > project > settings > API

NEXT_PUBLIC_SUPABASE_URL=URL
NEXT_PUBLIC_SUAPBASE_ANON_KEY=API_KEY

cd studio
npm i
npm run dev
```

### Additional configuration for table editor

The table editor requires [four helper functions](https://github.com/supabase/grid/blob/develop/FUNCTIONS.md) from [@supabase/grid](https://github.com/supabase/grid) to be created in the **public** schema of your Postgres database
before running this repo.

Ensure your you've set your Postgres schema to **public** in your SQL console either by adding

```sql
set search_path to public
```

to the top of your SQL console above the

```sql
create function
```

statements or by prepending `public` to each function name e.g.

```sql
CREATE FUNCTION public.load_table_info...
```
