# Payload CMS

### Local Development

1. First [clone the repo](#clone) if you have not done so already
2. `cd apps/cms && cp .env.example .env` to copy the example environment variables. You'll need to add the `S3_` variables to your `.env` if you want to use Supabase Storage.
3. `pnpm install && pnpm generate:importmap` to install dependencies and start the dev server.
4. run `pnpm dev` in the apps/cms folder or `pnpm dev:cms` from the root.
5. open `http://localhost:3030` to open the app in your browser

Changes made in `./src` will be reflected in the cms app. Follow the on-screen instructions to login and create the first admin user.

### Collections

Collections are what data looks like in the Payload cms schema. The following are the collections currently configured in the app.

- Users
- Authors
- Posts
- Pages
- Categories
- Tags