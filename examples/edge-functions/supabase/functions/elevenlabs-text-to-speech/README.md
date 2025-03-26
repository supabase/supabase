# Streaming and Caching Speech with ElevenLabs

Generate and stream speech through Supabase Edge Functions. Store speech in Supabase Storage and cache responses via built-in smart CDN.

## Requirements

- An ElevenLabs account with an [API key](/app/settings/api-keys).
- A [Supabase](https://supabase.com) account (you can sign up for a free account via [database.new](https://database.new)).
- The [Supabase CLI](https://supabase.com/docs/guides/local-development) installed on your machine.
- The [Deno runtime](https://docs.deno.com/runtime/getting_started/installation/) installed on your machine and optionally [setup in your facourite IDE](https://docs.deno.com/runtime/getting_started/setup_your_environment).

## Setup

### Create a Supabase project locally

After installing the [Supabase CLI](https://supabase.com/docs/guides/local-development), run the following command to create a new Supabase project locally:

```bash
supabase init
```

### Configure the storage bucket

You can configure the Supabase CLI to automatically generate a storage bucket by adding this configuration in the `config.toml` file:

```toml ./supabase/config.toml
[storage.buckets.audio]
public = false
file_size_limit = "50MiB"
allowed_mime_types = ["audio/mp3"]
objects_path = "./audio"
```

<Note>
  Upon running `supabase start` this will create a new storage bucket in your local Supabase
  project. Should you want to push this to your hosted Supabase project, you can run `supabase seed
  buckets --linked`.
</Note>

### Configure background tasks for Supabase Edge Functions

To use background tasks in Supabase Edge Functions when developing locally, you need to add the following configuration in the `config.toml` file:

```toml ./supabase/config.toml
[edge_runtime]
policy = "per_worker"
```

<Note>
  When running with `per_worker` policy, Function won't auto-reload on edits. You will need to
  manually restart it by running `supabase functions serve`.
</Note>

## Run locally

To run the function locally, run the following commands:

```bash
supabase start
```

Once the local Supabase stack is up and running, run the following command to start the function and observe the logs:

```bash
supabase functions serve
```

## Deploy to Supabase

If you haven't already, create a new Supabase account at [database.new](https://database.new) and link the local project to your Supabase account:

```bash
supabase link
```

Once done, run the following command to deploy the function:

```bash
supabase functions deploy
```

### Set the function secrets

Now that you have all your secrets set locally, you can run the following command to set the secrets in your Supabase project:

```bash
supabase secrets set --env-file supabase/functions/.env
```

## Test the function

The function is designed in a way that it can be used directly as a source for an `<audio>` element.

```html
<audio
  src="https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/elevenlabs-text-to-speech?text=Hello%2C%20world!&voiceId=JBFqnCBsd6RMkjVDRZzb"
  controls
/>
```

You can find an example frontend implementation in the complete code example on [GitHub](https://github.com/elevenlabs/elevenlabs-examples/tree/main/examples/text-to-speech/supabase/stream-and-cache-storage/src/pages/Index.tsx).

### Try it out

Navigate to `http://127.0.0.1:54321/functions/v1/elevenlabs-text-to-speech?text=hello%20world`.

Afterwards, navigate to `http://127.0.0.1:54323/project/default/storage/buckets/audio` to see the audio file in your local Supabase Storage bucket.

## Test the function

The function is designed in a way that it can be used directly as a source for an `<audio>` element.

```html
<audio
  src="https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/elevenlabs-text-to-speech?text=Hello%2C%20world!&voiceId=JBFqnCBsd6RMkjVDRZzb"
  controls
/>
```

You can find an example frontend implementation in the complete code example on [GitHub](https://github.com/elevenlabs/elevenlabs-examples/tree/main/examples/text-to-speech/supabase/stream-and-cache-storage/src/pages/Index.tsx).