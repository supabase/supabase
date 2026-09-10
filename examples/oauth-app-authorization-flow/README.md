# Supabase OAuth Apps Login Flow

1. Create OAuth App at https://supabase.com/dashboard/org/_/apps
2. Use http://localhost:3000 as `Authorization callback URLs`
3. Copy `.env.example` to `.env` and fill `Client ID` and `Client Secret` with values from newly created app
4. `bun install`
5. `bun run dev`
6. Open http://localhost:3000
