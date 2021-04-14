# Supabase Docs

### Contributing to the specs

- `cd /web/spec/`
- run `make` which will pull the latest TSDoc with your updates
- add your comments to `supabase.yml` | `postgrest.yml` | `gotrue.yml` | `realtime.yml`
- run `npm run gen:supabase` inside the `/spec` folder which will generate the Docusaurus pages
- run `npm run build` to make sure the build is working
- submit your PR
