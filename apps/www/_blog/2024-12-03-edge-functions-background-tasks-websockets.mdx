---
title: 'Supabase Edge Functions: Introducing Background Tasks, Ephemeral Storage, and WebSockets'
description: Edge functions can be used for workloads outside the request-response lifecycle
author: laktek,nyannyacha
imgSocial: launch-week-13/day-2-functions-background-tasks/og.jpg
imgThumb: launch-week-13/day-2-functions-background-tasks/thumb.jpg
categories:
  - product
tags:
  - functions
  - launch-week
date: '2024-12-03'
toc_depth: 3
launchweek: '13'
---

We are excited to announce three long-awaited features: Background Tasks, Ephemeral File Storage, and WebSockets.

Starting today, you can use these features in any project. Let's explore what exciting things you can build with them.

<div className="video-container">
  <iframe
    className="w-full"
    src="https://www.youtube-nocookie.com/embed/envrsJ8VfAU"
    title="Introducing Background Tasks, Ephemeral Storage, and WebSockets"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  />
</div>

## Background Tasks

Sometimes you need a backend logic to do more than respond to a request. For example, you might want to process a batch of files and upload the results to Supabase Storage. Or read multiple entries from a database table and generate embeddings for each entry.

With the introduction of background tasks, executing these long-running workloads with Edge Functions is super easy.

We've introduced a new method called `EdgeRuntime.waitUntil` , which accepts a promise. This ensures that the function isn't terminated until the promise is resolved.

Free projects can run background tasks for a maximum of 150 seconds (2m 30s). If you are on a paid plan, this limit increases to 400 seconds (6m 40s). We plan to introduce more flexible limits in the coming months.

You can subscribe to notifications when the function is about to be shut down by listening to `beforeunload` event. Read the guide for more details on [how to use background tasks](/docs/guides/functions/background-tasks).

## Ephemeral Storage

Edge Function invocations now have access to ephemeral storage. This is useful for background tasks, as it allows you to read and write files in the `/tmp` directory to store intermediate results.

Check the guide on how to access [ephemeral storage](/docs/guides/functions/ephemeral-storage).

### Example: Extracting a zip file and uploading its content to Supabase Storage

Let's look at a real-world example using Background Tasks and Ephemeral Storage.

Imagine you're building a Photo Album app. You want your users to upload photos as a zip file. You would extract them in an Edge Function and upload them to storage.

One of the most straightforward ways to implement is using streams:

```jsx
import { ZipReaderStream } from 'https://deno.land/x/zipjs/index.js'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

Deno.serve(async (req) => {
  const uploadId = crypto.randomUUID()

  const { error } = await supabase.storage.createBucket(uploadId, {
    public: false,
  })

  for await (const entry of await req.body.pipeThrough(new ZipReaderStream())) {
    // write file to Supabase Storage
    const { error } = await supabase.storage
      .from(uploadId)
      .upload(entry.filename, entry.readable, {})

    console.log('uploaded', entry.filename)
  }

  return new Response(
    JSON.stringify({
      uploadId,
    }),
    {
      headers: {
        'content-type': 'application/json',
      },
    }
  )
})
```

If you test out the streaming version, it will run into memory limit errors when you try to upload zip files over 100MB. This is because the streaming version has to keep every file in a zip archive in memory.

We can modify it instead to write the zip file to a temporary file. Then, use a background task to extract and upload it to Supabase Storage. This way, we only read parts of the zip file to the memory.

```jsx
import { BlobWriter, ZipReader, ZipReaderStream } from 'https://deno.land/x/zipjs/index.js'

import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

let numFilesUploaded = 0

async function processZipFile(uploadId, filepath) {
  const file = await Deno.open(filepath, { read: true })
  const zipReader = new ZipReader(file.readable)
  const entries = await zipReader.getEntries()

  await supabase.storage.createBucket(uploadId, {
    public: false,
  })

  await Promise.all(
    entries.map(async (entry) => {
      // read file entry
      const blobWriter = new BlobWriter()
      const blob = await entry.getData(blobWriter)

      if (entry.directory) {
        return
      }

      // write file to Supabase Storage
      await supabase.storage.from(uploadId).upload(entry.filename, blob, {})

      numFilesUploaded += 1
      console.log('uploaded', entry.filename)
    })
  )

  await zipReader.close()
}

// you can add a `beforeunload` event listener to be notified
// when Function Worker is about to terminate.
// use this to do any logging, save states.
globalThis.addEventListener('beforeunload', (ev) => {
  console.log('function about to terminate: ', ev.detail.reason)
  console.log('number of files uploaded: ', numFilesUploaded)
})

async function writeZipFile(filepath, stream) {
  await Deno.writeFile(filepath, stream)
}

Deno.serve(async (req) => {
  const uploadId = crypto.randomUUID()
  await writeZipFile('/tmp/' + uploadId, req.body)

  // process zip file in a background task
  // calling EdgeRuntime.waitUntil() would ensure
  // function worker wouldn't exit until the promise is completed.
  EdgeRuntime.waitUntil(processZipFile(uploadId, '/tmp/' + uploadId))

  return new Response(
    JSON.stringify({
      uploadId,
    }),
    {
      headers: {
        'content-type': 'application/json',
      },
    }
  )
})
```

## WebSockets

Edge Functions now support establishing both inbound (server) and outbound (client) WebSocket connections. This enables a variety of new use cases.

### Example: Building an authenticated relay to OpenAI Realtime API

OpenAI recently introduced a [Realtime API](https://openai.com/index/introducing-the-realtime-api/), which uses WebSockets. This is tricky to implement purely client-side because you'd need to expose your OpenAI key publicly. OpenAI [recommends](https://platform.openai.com/docs/guides/realtime/overview?text-generation-quickstart-example=audio) building a server to authenticate requests.

With our new support for WebSockets, you can easily do this in Edge Functions without standing up any infrastructure. Additionally, you can use [Supabase Auth](https://supabase.com/docs/guides/auth) to authenticate users and protect your OpenAI usage from being abused.

```jsx
import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

Deno.serve(async (req) => {
  const upgrade = req.headers.get('upgrade') || ''

  if (upgrade.toLowerCase() != 'websocket') {
    return new Response("request isn't trying to upgrade to websocket.")
  }

  // WebSocket browser clients does not support sending custom headers.
  // We have to use the URL query params to provide user's JWT.
  // Please be aware query params may be logged in some logging systems.
  const url = new URL(req.url)
  const jwt = url.searchParams.get('jwt')
  if (!jwt) {
    console.error('Auth token not provided')
    return new Response('Auth token not provided', { status: 403 })
  }
  const { error, data } = await supabase.auth.getUser(jwt)
  if (error) {
    console.error(error)
    return new Response('Invalid token provided', { status: 403 })
  }
  if (!data.user) {
    console.error('user is not authenticated')
    return new Response('User is not authenticated', { status: 403 })
  }

  const { socket, response } = Deno.upgradeWebSocket(req)

  socket.onopen = () => {
    // initiate an outbound WebSocket connection to OpenAI
    const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01'

    // openai-insecure-api-key isn't a problem since this code runs in an Edge Function
    const openaiWS = new WebSocket(url, [
      'realtime',
      `openai-insecure-api-key.${OPENAI_API_KEY}`,
      'openai-beta.realtime-v1',
    ])

    openaiWS.onopen = () => {
      console.log('Connected to OpenAI server.')

      socket.onmessage = (e) => {
        console.log('socket message:', e.data)
        // only send the message if openAI ws is open
        if (openaiWS.readyState === 1) {
          openaiWS.send(e.data)
        } else {
          socket.send(
            JSON.stringify({
              type: 'error',
              msg: 'openAI connection not ready',
            })
          )
        }
      }
    }

    openaiWS.onmessage = (e) => {
      console.log(e.data)
      socket.send(e.data)
    }

    openaiWS.onerror = (e) => console.log('OpenAI error: ', e.message)
    openaiWS.onclose = (e) => console.log('OpenAI session closed')
  }

  socket.onerror = (e) => console.log('socket errored:', e.message)
  socket.onclose = () => console.log('socket closed')

  return response // 101 (Switching Protocols)
})
```

## Performance and stability

In the past few months, we have made many [performance, stability,](https://supabase.com/blog/edge-functions-faster-smaller) and [DX improvements](https://github.com/orgs/supabase/discussions/30307) to Edge Functions. While these improvements often aren't visible to the end-users, they are the foundation of the new features we are announcing today.

## What's next?

We have a very exciting roadmap planned for 2025. One of the main priorities is to provide customizable compute limits (memory, CPU, and execution duration). We will soon announce an update on it.

Stay tuned for the upcoming launches this week. You will see how all these upcoming pieces fit like Lego bricks to make your developer life easy.
