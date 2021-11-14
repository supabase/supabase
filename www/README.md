# Supabase Docs

## Overview

This is a single repository for two different websites. Our documents were created with docusaurus and are stored in the web folder. Our beta website can be found in the www folder. This is a standard Next.js website.

Install the [Vercel CLI](https://vercel.com/cli).

You will need to run the marketing website and docs website separately.

```
# tab 1
make dev

# tab 2
cd www
npm install
npm run dev

# tab 3
cd web/spec
make
npm install
npm run gen:supabase
npm run start
```

In production, this setup is deployed as two different vercel websites (`docs` and `www`)

## Known issues

- Referencing resources in nested folders may not work for `web` (eg `/web/static/folder/nestedfolder/asset`) may not work.
- Possibly need to prepend all images/assets in docs site with baseUrl.

<!-- // we need to check this -->
<!-- - Don't use `Link` since that adds `/new` to the links. Use plain `a` tags when possible. -->
