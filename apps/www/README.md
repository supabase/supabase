# Supabase Docs

## Overview

This is a single repository for two different websites. Our documents were created with docusaurus and are stored in the web folder. Our beta website can be found in the www folder. This is a standard Next.js website.

Install the [Vercel CLI](https://vercel.com/cli).

You will need to run the marketing website and docs website separately. To learn how to run both websites, see the [Development Guide](../DEVELOPERS.md) for more information.

```sh
# step 1
cd supabase

# step 2
cd www

# step 3
npm install
npm run dev

# visit website
http://localhost:3000
```

In production, this setup is deployed as two different vercel websites (`docs` and `www`)

## Known issues

- Referencing resources in nested folders may not work for `web` (eg `/web/static/folder/nestedfolder/asset`) may not work.
- Possibly need to prepend all images/assets in docs site with baseUrl.
