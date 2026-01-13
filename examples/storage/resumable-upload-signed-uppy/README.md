## Resumable Uploads with Supabase Storage and Uppy

This example shows how to use signed urls from [Supabase Storage](https://supabase.io/docs/reference/javascript/storage) with [Uppy](https://uppy.io/) to upload files to Supabase Storage using the TUS protocol (signed resumable uploads).

This works by calling `createSignedUploadUrl()` to get a token for each file, and passing that token via the `x-signature` header when uploading the files

### Running the example

- Start local supabase project `supabase start`
- Open the index.html file and set `SUPABASE_PUBLISHABLE_KEY` to the value output when starting the supabase cli
- Serve the index.html file locally (e.g. with Python Simple HTTP Server or http-server npm package) and start uploading:

```bash
# python http server
python3 -m http.server

# npm http-server
npx http-server
```

### How it works

In index.html the `uppy.on('file-added')` hook calls the [create-upload-token](supabase/functions/create-upload-token/index.ts) function which creates a token for each added file and attaches it to that file's header config as `x-signature`. 
