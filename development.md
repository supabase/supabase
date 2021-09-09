## Overview

This is a mono repo of two different websites. Our docs are built with docusaurus and is located in `web` folder. Our beta website is located in `www` folder. This is a standard Next.js website.

The beta website has a `basePath` of `new` and using `vercel.json`. This is to distinguish between http requests between both the websites. Any request with path starting with `/new/` will be routed to the beta website.

Install the [Vercel CLI](https://vercel.com/cli).

To run this locally, run the following commands. This will start the website at http://localhost:8080/ and requests will be automatically proxied (via vercel rewrites) to the docs website (running at http://localhost:3005/) and the beta website (running at http://localhost:3000)

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

In production, this setup runs as three separate vercel websites (`docs`, `www` and `main`)

## Known issues

- Some hardcoding of `/new` in `www`. Should be fine as long as the basePath doesn't change.
- Referencing resources in nested folders may not work for `web` (eg `/web/static/folder/nestedfolder/asset`) may not work.
- Don't use `Link` since that adds `/new` to the links. Use plain `a` tags when possible.
