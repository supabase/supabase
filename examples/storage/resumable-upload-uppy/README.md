## Resumable Upload with Supabase Storage and Uppy

This example shows how to use [Supabase Storage](https://supabase.io/docs/reference/javascript/storage) with [Uppy](https://uppy.io/) to upload files to Supabase Storage using
the TUS protocol (resumable uploads).

### Running the example

- Create a supabase bucket from the Supabase UI
- Open the index.html file and replace the following variables with your own:

```js
const token = ''            // jwt token or service role key
const project = ''          // supabase project id
const bucketName = ''       // supabase bucket name
```



Open the index.html on your browser and start uploading files.