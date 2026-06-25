// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { ImageResponse } from 'npm:@vercel/og@^0'
import React from 'npm:react@19'
import { withSupabase } from 'npm:@supabase/server@^1'

import { getTweets } from './getTweet.ts'
import Tweet from './Tweet.tsx'

const STORAGE_URL =
  'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/tweet-to-image'

// Load custom font
const FONT_URL = `${STORAGE_URL}/CircularStd-Book.otf`
const font = fetch(new URL(FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())

console.log(`Function "tweet-to-image" up and running!`)

async function handler(req: Request, ctx) {
  const url = new URL(req.url)
  const tweetId = url.searchParams.get('tweetId')

  if (!tweetId) return Response.json({ error: 'missing tweetId param' }, { status: 400 })

  try {
    // Try to get image from Supabase Storage CDN.
    const storageResponse = await fetch(`${STORAGE_URL}/${tweetId}.png`)
    if (storageResponse.ok) return storageResponse

    // Else, generate image and upload to storage.
    const fontData = await font

    const tweets = await getTweets([tweetId])
    const tweet = tweets[0]
    console.log('formattedTweets', JSON.stringify(tweets, null, 2))
    const generatedImage = new ImageResponse(
      React.createElement(
        'div',
        {
          style: {
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1c1c1c',
            color: '#EDEDED',
          },
        },
        React.createElement(Tweet, { ...tweet })
      ),
      {
        width: 1200,
        height: 630,
        // Supported options: 'twemoji', 'blobmoji', 'noto', 'openmoji', 'fluent', 'fluentFlat'
        // Default to 'twemoji'
        emoji: 'twemoji',
        fonts: [
          {
            name: 'Circular',
            data: fontData,
            style: 'normal',
          },
        ],
      }
    )

    // Upload image to storage.
    const { error } = await ctx.supabaseAdmin.storage
      .from('images')
      .upload(`tweet-to-image/${tweetId}.png`, generatedImage.body!, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: false,
      })
    if (error) throw error

    return generatedImage
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }
}

// Uploads to Storage with a secret key, so deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'secret' }, handler),
}
