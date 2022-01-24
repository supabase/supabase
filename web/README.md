# Supabase Docs

### Contributing to the specs

- `cd /web/spec/`
- run `npm install`
- run `make` which will pull the latest TSDoc with your updates

> Note: `make` requires [`jq - a lightweight and flexible command-line JSON processor`](https://stedolan.github.io/jq/). To install on OSX with homebrew, run: `brew install jq`.

- Add your comments to `supabase.yml` | `dart.yml` | `postgrest.yml` | `gotrue.yml` | `realtime.yml`
- run `npm run gen:supabase` inside the `/spec` folder which will generate the Docusaurus pages
- run `npm run build` to make sure the build is working
- Submit your PR
