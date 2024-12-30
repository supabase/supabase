# Self-Host Maps on Supabase Storage with Protomaps

## Create a static PMTiles Map file

Follow the instructions in the [Protomaps docs](https://docs.protomaps.com/guide/getting-started) to extract a `my_area.pmtiles` file.

## Upload to Supabase Storage

1. Create a new private bucket called `maps-private`.
2. Upload your `my_area.pmtiles` file there.

Take note of the [file size limits](https://supabase.com/docs/guides/storage/uploads/file-limits#global-file-size) depending on your project tier.

## Proxy through Edge Functions

You can use [Supabase Edge Functions](https://supabase.com/edge-functions) to set up fine grained access controls. Use the [/supabase/functions/maps-private/index.ts](/supabase/functions/maps-private/index.ts).

You can also use Edge Functions with Supabase Auth JWTs to only render Maps for authenticated users for example. [Read the docs](https://supabase.com/docs/guides/functions/auth).

1. Deploy the function to your Supabase project: `supabase functions deploy maps-private --no-verify-jwt`.
2. Update the `protomaps.url` in the [index.html](/index.html) file.

## Start simple web server

You can use python to serve the `index.html` file:

```bash
python3 -m http.server
```

Now navigate to http://localhost:8000/ to see your beauiful Map!
