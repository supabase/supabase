# Payload CMS

### Local Development

1. run `cd apps/cms && supabase start` to start the local supabase project
2. run `cp .env.example .env` to copy the example environment variables and update the variables. You'll need to add the `S3_` variables to your `.env` to use Supabase Storage
3. `pnpm install && pnpm generate:importmap` to install dependencies and start the dev server
4. run `pnpm dev` in the apps/cms folder or `pnpm dev:cms` from the root
5. open `http://localhost:3030` to open the app in your browser

Follow the on-screen instructions to login and create the first admin user.

### Collections

Collections are what data looks like in the Payload cms schema. The following are the collections currently configured in the app.

- Authors
- Categories
- Events
- Media
- Posts
- Tags
- Users
