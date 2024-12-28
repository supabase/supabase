// This example shows how to use Edge Functions to read incoming multipart/form-data request,
// and write files to Supabase Storage and other fields to a database table.

import { Application } from 'https://deno.land/x/oak@v11.1.0/mod.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const MB = 1024 * 1024

const app = new Application()

app.use(async (ctx) => {
  const body = ctx.request.body({ type: 'form-data' })
  const formData = await body.value.read({
    // Need to set the maxSize so files will be stored in memory.
    // This is necessary as Edge Functions don't have disk write access.
    // We are setting the max size as 10MB (an Edge Function has a max memory limit of 150MB)
    // For more config options, check: https://deno.land/x/oak@v11.1.0/mod.ts?s=FormDataReadOptions
    maxSize: 10 * MB,
  })
  if (!formData.files || !formData.files.length) {
    ctx.response.status = 400
    ctx.response.body = 'missing file'
    return
  }

  const supabaseClient = createClient(
    // Supabase API URL - env var exported by default.
    Deno.env.get('SUPABASE_URL')!,
    // Supabase API ANON KEY - env var exported by default.
    Deno.env.get('SUPABASE_ANON_KEY')!
  )

  //upload image to Storage
  const file = formData.files[0]
  const timestamp = +new Date()
  const uploadName = `${file.name}-${timestamp}`
  const { data: upload, error: uploadError } = await supabaseClient.storage
    .from('images')
    .upload(uploadName, file.content!.buffer, {
      contentType: file.contentType,
      cacheControl: '3600',
      upsert: false,
    })
  if (uploadError) {
    console.error(uploadError)
    ctx.response.status = 500
    ctx.response.body = 'Failed to upload the file'
    return
  }

  // insert record to messages table
  const { error } = await supabaseClient.from('comments').insert({
    message: formData.fields!.message || '',
    image_path: upload.path,
  })
  if (error) {
    console.error(error)
    ctx.response.status = 500
    ctx.response.body = 'Fail to add the record'
    return
  }

  ctx.response.status = 201
  ctx.response.body = 'Success!'
})

await app.listen({ port: 8000 })
