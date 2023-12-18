# Store

## Store structure

At the root, there are currently 3 top-level stores in use: `app`, `meta` and `ui` (`content` is WIP at the moment). Each of them store the following information:

- `app`: Application level data (Projects and organizations)
- `meta`: Database information (e.g Tables, Columns, Policies)
- `ui`: UI states that are common globally
- `content`: User-specific content (e.g Saved SQL snippets)

## Accessing the store

The `useStore` hook is the entry point to access the store in your pages and components.

```
import { useStore } from 'hooks'
const { app, meta, ui } = useStore()
```

## What is the jsonSchema folder

The files here are used to populate form fields on the dashboard with the `ajv` library. We have in mind to move away from this way of rendering form fields due to its rigid nature but we've yet to decide.
