// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { withSupabase } from 'npm:@supabase/server@^1'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    // read a text file from storage and print its contents
    try {
      const { data, error } = await ctx.supabase.storage.from('my-bucket').download('sample.txt')
      if (error) throw error

      // file contents are returned as a blob, we can convert it to utf-8 text by calling text() method.
      const contents = await data.text()

      // prints out the contents of the file
      console.log(contents)

      return Response.json({ contents })
    } catch (error) {
      console.error(error)

      return Response.json({ error: error.message }, { status: 400 })
    }
  }),
}
