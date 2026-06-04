---
title: 'Mozilla Llamafile in Supabase Edge Functions'
description: 'Use Mozilla Llamafile OpenAI API compatible server in Supabase Edge Functions.'
author: thor_schaeff
imgSocial: mozilla-llamafile/mozilla-llamafile-og.png
imgThumb: mozilla-llamafile/mozilla-llamafile-og.png
categories:
  - product
tags:
  - functions
  - AI
date: '2024-08-21'
toc_depth: 3
---

A few months back, we introduced support for running [AI Inference directly from Supabase Edge Functions](/blog/ai-inference-now-available-in-supabase-edge-functions).

Today we are adding [Mozilla Llamafile](https://github.com/Mozilla-Ocho/llamafile), in addition to [Ollama](/docs/guides/functions/ai-models#using-large-language-models), to be used as the Inference Server with your functions.

Mozilla Llamafile lets you distribute and run LLMs with a single file that runs locally on most computers, with no installation! In addition to a local web UI chat server, Llamafile also provides an OpenAI API compatible server, that is now integrated with Supabase Edge Functions.

<div className="video-container">
  <iframe
    className="w-full"
    src="https://www.youtube-nocookie.com/embed/_6L-dnBn2wg"
    title="The Supabase Book by David Lorenz"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  />
</div>

<Admonition type="info">

Want to jump straight into the code? You can find the examples on [GitHub](https://github.com/supabase/supabase/blob/master/examples/ai/llamafile-edge)!

</Admonition>

## Getting started

Follow the [Llamafile Quickstart Guide](https://github.com/Mozilla-Ocho/llamafile?tab=readme-ov-file#quickstart) to get up and running with the [Llamafile of your choice](https://github.com/Mozilla-Ocho/llamafile?tab=readme-ov-file#other-example-llamafiles).

Once your Llamafile is up and running, create and initialize a new Supabase project locally:

```bash
npx supabase bootstrap scratch
```

If using VS Code, when promptedt `Generate VS Code settings for Deno? [y/N]` select `y` and follow the steps. Then open the project in your favoiurte code editor.

## Call Llamafile with functions-js

Supabase Edge Functions now comes with an OpenAI API compatible mode, allowing you to call a Llamafile server easily via `@supabase/functions-js`.

Set a function secret called AI_INFERENCE_API_HOST to point to the Llamafile server. If you don't have one already, create a new `.env` file in the `functions/` directory of your Supabase project.

```txt supabase/functions/.env
AI_INFERENCE_API_HOST=http://host.docker.internal:8080
```

Next, create a new function called `llamafile`:

```bash
npx supabase functions new llamafile
```

Then, update the `supabase/functions/llamafile/index.ts` file to look like this:

```ts supabase/functions/llamafile/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
const session = new Supabase.ai.Session('LLaMA_CPP')

Deno.serve(async (req: Request) => {
  const params = new URL(req.url).searchParams
  const prompt = params.get('prompt') ?? ''

  // Get the output as a stream
  const output = await session.run(
    {
      messages: [
        {
          role: 'system',
          content:
            'You are LLAMAfile, an AI assistant. Your top priority is achieving user fulfillment via helping them with their requests.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
    {
      mode: 'openaicompatible', // Mode for the inference API host. (default: 'ollama')
      stream: false,
    }
  )

  console.log('done')
  return Response.json(output)
})
```

## Call Llamafile with the OpenAI Deno SDK

Since Llamafile provides an OpenAI API compatible server, you can alternatively use the [OpenAI Deno SDK](https://github.com/openai/openai-deno) to call Llamafile from your Supabase Edge Functions.

For this, you will need to set the following two environment variables in your Supabase project. If you don't have one already, create a new `.env` file in the `functions/` directory of your Supabase project.

```txt supabase/functions/.env
OPENAI_BASE_URL=http://host.docker.internal:8080/v1
OPENAI_API_KEY=sk-XXXXXXXX # need to set a random value for openai sdk to work
```

Now, replace the code in your `llamafile` function with the following:

```ts supabase/functions/llamafile/index.ts
import OpenAI from 'https://deno.land/x/openai@v4.53.2/mod.ts'

Deno.serve(async (req) => {
  const client = new OpenAI()
  const { prompt } = await req.json()
  const stream = true

  const chatCompletion = await client.chat.completions.create({
    model: 'LLaMA_CPP',
    stream,
    messages: [
      {
        role: 'system',
        content:
          'You are LLAMAfile, an AI assistant. Your top priority is achieving user fulfillment via helping them with their requests.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  if (stream) {
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
    })

    // Create a stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          for await (const part of chatCompletion) {
            controller.enqueue(encoder.encode(part.choices[0]?.delta?.content || ''))
          }
        } catch (err) {
          console.error('Stream error:', err)
        } finally {
          controller.close()
        }
      },
    })

    // Return the stream to the user
    return new Response(stream, {
      headers,
    })
  }

  return Response.json(chatCompletion)
})
```

<Admonition type="info">

Note that the model parameter doesn't have any effect here! The model depends on which Llamafile is currently running!

</Admonition>

## Serve your functions locally

To serve your functions locally, you need to install the [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started#running-supabase-locally) as well as [Docker Desktop](https://docs.docker.com/desktop) or [Orbstack](https://orbstack.dev/).

You can now serve your functions locally by running:

```bash
supabase start
supabase functions serve --env-file supabase/functions/.env
```

Execute the function

```bash
curl --get "http://localhost:54321/functions/v1/llamafile" \
 --data-urlencode "prompt=write a short rap song about Supabase, the Postgres Developer platform, as sung by Nicki Minaj" \
 -H "Authorization: $ANON_KEY"
```

## Deploying a Llamafile

There is a great guide on how to [containerize a Lllamafile](https://www.docker.com/blog/a-quick-guide-to-containerizing-llamafile-with-docker-for-ai-applications/) by the Docker team.

You can then use a service like [Fly.io](https://fly.io/) to deploy your dockerized Llamafile.

## Deploying your Supabase Edge Functions

Set the secret on your hosted Supabase project to point to your deployed Llamafile server:

```bash
supabase secrets set --env-file supabase/functions/.env
```

Deploy your Supabase Edge Functions:

```bash
supabase functions deploy
```

Execute the function:

```bash
curl --get "https://project-ref.supabase.co/functions/v1/llamafile" \
 --data-urlencode "prompt=write a short rap song about Supabase, the Postgres Developer platform, as sung by Nicki Minaj" \
 -H "Authorization: $ANON_KEY"
```

## Get access to Supabase Hosted LLMs

Access to open-source LLMs is currently invite-only while we manage demand for the GPU instances. Please [get in touch](https://forms.supabase.com/supabase.ai-llm-early-access) if you need early access.

We plan to extend support for more models. [Let us know](https://forms.supabase.com/supabase.ai-llm-early-access) which models you want next. We're looking to support fine-tuned models too!

## More Supabase Resources

- Edge Functions: [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- Vectors: [supabase.com/docs/guides/ai](https://supabase.com/docs/guides/ai)
- [Semantic search demo](https://github.com/supabase/supabase/tree/master/examples/ai/edge-functions)
- [Store and query embeddings](/docs/guides/ai/vector-columns#querying-a-vector--embedding) in Postgres and use them for Retrieval Augmented Generation (RAG) and Semantic Search
