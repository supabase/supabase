# Supabase Docs

## Overview

Our documents were created with docusaurus and are stored in the web folder. Our website can be found in the www folder. This is a standard Next.js website.

```

# website
cd www
npm install
npm run dev

# docs
cd web/spec
make
npm install
npm run gen:supabase
cd ../
npm run start
```

## Known issues

- Referencing resources inside html/jsx inside a markdown file inside `/web` requires you to prepend `/docs/` to any urls. Anything that is not in html/jsx in markdown can just be treated as normal.
- Referencing resources in nested folders may not work for `web` (eg `/web/static/folder/nestedfolder/asset`) may not work.
