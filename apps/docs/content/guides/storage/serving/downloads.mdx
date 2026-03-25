---
id: 'storage-image-downloads'
title: 'Serving assets from Storage'
description: 'Serving assets from Storage'
subtitle: 'Serving assets from Storage'
sidebar_label: 'Serving assets'
tocVideo: 'dLqSmxX3r7I'
---

## Public buckets

As mentioned in the [Buckets Fundamentals](/docs/guides/storage/buckets/fundamentals) all files uploaded in a public bucket are publicly accessible and benefit a high CDN cache HIT ratio.

You can access them by using this conventional URL:

```
https://[project_id].supabase.co/storage/v1/object/public/[bucket]/[asset-name]
```

You can also use the Supabase SDK `getPublicUrl` to generate this URL for you

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('your_project_url', 'your_supabase_api_key')

// ---cut---
const { data } = supabase.storage.from('bucket').getPublicUrl('filePath.jpg')

console.log(data.publicUrl)
```

### Downloading

If you want the browser to start an automatic download of the asset instead of trying serving it, you can add the `?download` query string parameter.

By default it will use the asset name to save the file on disk. You can optionally pass a custom name to the `download` parameter as following: `?download=customname.jpg`

#### Programmatic downloads with query parameters

When using the SDK's `download()` method, you can pass additional query parameters to customize the download behavior:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('your_project_url', 'your_supabase_api_key')

// ---cut---
// Download with custom filename
const { data, error } = await supabase.storage.from('avatars').download('avatar1.png', {
  download: 'my-custom-name.png',
})
```

</TabPanel>
<$Show if="sdk:dart">
<TabPanel id="dart" label="Dart">

```dart
// Download with additional query parameters
final response = await supabase.storage
  .from('avatars')
  .download(
    'avatar1.png',
    queryParams: {
      'download': 'my-custom-name.png',
    },
  );
```

[Reference.](/docs/reference/dart/storage-from-download)

</TabPanel>
</$Show>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

```swift
// Download with additional query parameters
let response = try await supabase.storage
  .from("avatars")
  .download(
    path: "avatar1.png",
    queryItems: [
      URLQueryItem(name: "download", value: "my-custom-name.png")
    ]
  )
```

[Reference.](/docs/reference/swift/storage-from-download)

</TabPanel>
</$Show>
</Tabs>

## Private buckets

Assets stored in a non-public bucket are considered private and are not accessible via a public URL like the public buckets.

You can access them only by:

- Signing a time limited URL on the Server, for example with Edge Functions.
- with a GET request the URL `https://[project_id].supabase.co/storage/v1/object/authenticated/[bucket]/[asset-name]` and the user Authorization header

### Signing URLs

You can sign a time-limited URL that you can share to your users by invoking the `createSignedUrl` method on the SDK.

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('your_project_url', 'your_supabase_api_key')

// ---cut---
const { data, error } = await supabase.storage
  .from('bucket')
  .createSignedUrl('private-document.pdf', 3600)

if (data) {
  console.log(data.signedUrl)
}
```
