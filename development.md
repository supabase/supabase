## Overview

This is a mono repo of two different websites. Our docs are built with docusaurus and is located in `web` folder. Our beta website is located in `www` folder. This is a standard Next.js website.

Install the [Vercel CLI](https://vercel.com/cli).

To run this locally, run the following commands. This will start the website at http://localhost:8080/ and requests will be automatically proxied (via vercel rewrites) to the docs website (running at http://localhost:3005/) and the beta website (running at http://localhost:3000)

```
# tab 1
make dev

# tab 2
cd www
npm run dev

# tab 3
cd web
npm run start
```

In production, this setup runs as three separate vercel websites (`docs`, `www` and `main`)