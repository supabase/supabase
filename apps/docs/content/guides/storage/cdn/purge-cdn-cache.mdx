---
id: 'storage-cdn-purge-cache'
title: 'Purge CDN Cache'
description: 'Learn how to manually purge Supabase Storage CDN cache.'
sidebar_label: 'CDN'
---

With Smart CDN enabled, Supabase Storage automatically invalidates the cache when files are updated or deleted. However, there are scenarios where you may need to manually purge the CDN cache for specific objects or entire buckets. The cache purge API allows you to immediately queue cache content invalidation across all CDN edge nodes.

Manual cache purging is useful when you need to ensure that updates are propagated as soon as possible, or when you want to clear the cache for debugging purposes. Once purged, the next request for that object will be served from the origin server, and the CDN cache will be repopulated.

<Admonition type="caution">

Cache purging requires the **secret key**. The server rejects calls made with the legacy anon key or a user JWT. Never expose your secret key in client-side code.

</Admonition>

<Admonition type="note">

CDN cache purge is available for [Pro Plan and above](/pricing).

</Admonition>

## Purge a single object

You can purge the CDN cache for a specific file by providing the exact path to the object. This operation does not support wildcards or recursion. You must specify the complete path of the file you want to invalidate.

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

```javascript
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with secret key
const supabase = createClient('your_project_url', 'your_secret_key')

// Purge cache for a single object
async function purgeCachedObject() {
  const { data, error } = await supabase.storage
    .from('bucket_name')
    .purgeCache('folder_name/file_name.png')

  if (error) {
    // Handle error
  } else {
    // Handle success
    console.log(data.message) // 'success'
  }
}
```

</TabPanel>
<TabPanel id="curl" label="cURL">

```bash
curl -X DELETE "https://{your_project_ref}.supabase.co/storage/v1/cdn/bucket_name/folder_name/file_name.png" \
  -H "apikey: {your_secret_key}"

# If using legacy jwt keys use this header: Authorization: Bearer {your_service_role_jwt}
```

</TabPanel>
</Tabs>

## Purge an entire bucket

For scenarios where you need to invalidate all cached objects in a bucket, you can purge the entire bucket's cache. This is useful when performing bulk updates or major changes to your storage bucket.

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

```javascript
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with secret key
const supabase = createClient('your_project_url', 'your_secret_key')

// Purge cache for an entire bucket
async function purgeBucketCache() {
  const { data, error } = await supabase.storage.purgeBucketCache('bucket_name')

  if (error) {
    // Handle error
  } else {
    // Handle success
    console.log(data.message) // 'success'
  }
}
```

</TabPanel>
<TabPanel id="curl" label="cURL">

```bash
curl -X DELETE "https://{your_project_ref}.supabase.co/storage/v1/cdn/bucket_name" \
  -H "apikey: {your_secret_key}"

# If using legacy jwt keys use this header: Authorization: Bearer {your_service_role_jwt}
```

</TabPanel>
</Tabs>

## Cache propagation

After purging the cache, it can take **up to 60 seconds** for the invalidation to propagate across all CDN edge nodes worldwide. During this time, some users may still receive cached content depending on which edge node they are routed to.

Keep in mind that purging the CDN cache does not affect browser caches. If users have the asset cached locally in their browser, they will continue to see the cached version until the browser cache expires based on the `cacheControl` value set during upload.
