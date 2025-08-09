---
id: 'storage-caching'
title: 'Integrating with Supabase Storage'
description: 'Integrate Edge Functions with Supabase Storage.'
tocVideo: 'wW6L52v9Ldo'
---

Edge Functions work seamlessly with [Supabase Storage](/docs/guides/storage). This allows you to:

- Upload generated content directly from your functions
- Implement cache-first patterns for better performance
- Serve files with built-in CDN capabilities

---

## Basic file operations

Use the Supabase client to upload files directly from your Edge Functions. You'll need the service role key for server-side storage operations:

```typescript
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Generate your content
  const fileContent = await generateImage()

  // Upload to storage
  const { data, error } = await supabaseAdmin.storage
    .from('images')
    .upload(`generated/${filename}.png`, fileContent.body!, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw error
  }

  return new Response(JSON.stringify({ path: data.path }))
})
```

<Admonition type="caution">

Always use the `SUPABASE_SERVICE_ROLE_KEY` for server-side operations. Never expose this key in client-side code!

</Admonition>

---

## Cache-first pattern

Check storage before generating new content to improve performance:

```typescript
const STORAGE_URL = 'https://your-project.supabase.co/storage/v1/object/public/images'

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const username = url.searchParams.get('username')

  try {
    // Try to get existing file from storage first
    const storageResponse = await fetch(`${STORAGE_URL}/avatars/${username}.png`)

    if (storageResponse.ok) {
      // File exists in storage, return it directly
      return storageResponse
    }

    // File doesn't exist, generate it
    const generatedImage = await generateAvatar(username)

    // Upload to storage for future requests
    const { error } = await supabaseAdmin.storage
      .from('images')
      .upload(`avatars/${username}.png`, generatedImage.body!, {
        contentType: 'image/png',
        cacheControl: '86400', // Cache for 24 hours
      })

    if (error) {
      console.error('Upload failed:', error)
    }

    return generatedImage
  } catch (error) {
    return new Response('Error processing request', { status: 500 })
  }
})
```
