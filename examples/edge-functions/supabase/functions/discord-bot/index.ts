// Sift is a small routing library that abstracts away details like starting a
// listener on a port, and provides a simple function (serve) that has an API
// to invoke a function for a specific path.
import { json, serve, validateRequest } from 'https://deno.land/x/sift@0.6.0/mod.ts'
// TweetNaCl is a cryptography library that we use to verify requests
// from Discord.
import nacl from 'https://cdn.skypack.dev/tweetnacl@v1.0.3?dts'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { Database } from './types/database.types.ts'
import { DiscordWebhookEvent } from './types/discord.ts'

const supabaseAdminClient = createClient<Database>(
  // Supabase API URL - env var exported by default when deployed.
  Deno.env.get('SUPABASE_URL') ?? '',
  // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// For all requests to "/" endpoint, we want to invoke bot() handler.
serve({
  '/discord-bot': bot,
})

// The main logic of the Discord Slash Command is defined in this function.
async function bot(request: Request) {
  // validateRequest() ensures that a request is of POST method and
  // has the following headers.
  const { error } = await validateRequest(request, {
    POST: {
      headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
    },
  })
  if (error) {
    return json({ error: error.message }, { status: error.status })
  }

  // verifySignature() verifies if the request is coming from Discord.
  // When the request's signature is not valid, we return a 401 and this is
  // important as Discord sends invalid requests to test our verification.
  const { valid, body } = await verifySignature(request)
  if (!valid) {
    return json(
      { error: 'Invalid request' },
      {
        status: 401,
      }
    )
  }
  console.log(body)
  const {
    channel_id = '',
    type = 0,
    data = { options: [] },
    member: { user } = {},
  } = JSON.parse(body) as DiscordWebhookEvent
  // Discord performs Ping interactions to test our application.
  // Type 1 in a request implies a Ping interaction.
  if (type === 1) {
    return json({
      type: 1, // Type 1 in a response is a Pong interaction response type.
    })
  }

  // Type 2 in a request is an ApplicationCommand interaction.
  // It implies that a user has issued a command.
  if (type === 2) {
    const { options: newOptions } = data.options.find((option) => option.name === 'new') ?? {
      value: null,
    }
    const { options: resolveOptions } = data.options.find(
      (option) => option.name === 'resolve'
    ) ?? {
      value: null,
    }

    let resMsg = 'An error occured.'

    // Handle new challenge creation.
    if (user && newOptions) {
      const { value: promise } = newOptions.find((option) => option.name === 'promise')!

      const { data: existingChallenge } = await supabaseAdminClient
        .from('discord_promise_challenge')
        .select('*')
        .match({ user_id: user.id, resolved: false })
        .maybeSingle()
      if (existingChallenge) {
        resMsg = `You must complete your open challenge first before creating a new one! Your ongoing challenge: "${existingChallenge.promise}".`
      } else {
        const { error: insertError } = await supabaseAdminClient
          .from('discord_promise_challenge')
          .insert({ promise, user_id: user.id, username: user.username })
        if (insertError) resMsg = insertError.message
        else
          resMsg = `New challenge "${promise}" created. Once completed come back here and submit via "/promise resolve"!`
      }
    }

    // Handle submission for existing challenge.
    if (user && resolveOptions) {
      const { value: submission } = resolveOptions.find((option) => option.name === 'submission')!

      const { data: updatedChallenge, error: updateError } = await supabaseAdminClient
        .from('discord_promise_challenge')
        .update({ submission, resolved: true })
        .match({ user_id: user.id, resolved: false })
        .select('promise')
        .single()
      if (updateError) resMsg = updateError.message
      else
        resMsg = `Thanks! Your submission for challenge "${updatedChallenge.promise}" has been recorded \\o/`
    }

    return json({
      // Type 4 responds with the below message retaining the user's
      // input at the top.
      type: 4,
      data: {
        content: resMsg,
      },
    })
  }

  // We will return a bad request error as a valid Discord request
  // shouldn't reach here.
  return json({ error: 'bad request' }, { status: 400 })
}

/** Verify whether the request is coming from Discord. */
async function verifySignature(request: Request): Promise<{ valid: boolean; body: string }> {
  const PUBLIC_KEY = Deno.env.get('DISCORD_PUBLIC_KEY')!
  // Discord sends these headers with every request.
  const signature = request.headers.get('X-Signature-Ed25519')!
  const timestamp = request.headers.get('X-Signature-Timestamp')!
  const body = await request.text()
  const valid = nacl.sign.detached.verify(
    new TextEncoder().encode(timestamp + body),
    hexToUint8Array(signature),
    hexToUint8Array(PUBLIC_KEY)
  )

  return { valid, body }
}

/** Converts a hexadecimal string to Uint8Array. */
function hexToUint8Array(hex: string) {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((val) => parseInt(val, 16)))
}
