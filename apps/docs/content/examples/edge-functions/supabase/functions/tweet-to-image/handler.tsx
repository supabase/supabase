import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getTweets } from './getTweet.ts'
import Tweet from './Tweet.tsx'

const STORAGE_URL =
  'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/tweet-to-image'

// Load custom font
const FONT_URL = `${STORAGE_URL}/CircularStd-Book.otf`
const font = fetch(new URL(FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())

export async function handler(req: Request) {
  const url = new URL(req.url)
  const tweetId = url.searchParams.get('tweetId')

  if (!tweetId)
    return new Response(JSON.stringify({ error: 'missing tweetId param' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })

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
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1c1c1c',
            color: '#EDEDED',
          }}
        >
          <Tweet {...tweet} />
        </div>
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

    const supabaseAdminClient = createClient(
      // Supabase API URL - env var exported by default when deployed.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Upload image to storage.
    const { error } = await supabaseAdminClient.storage
      .from('images')
      .upload(`tweet-to-image/${tweetId}.png`, generatedImage.body!, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: false,
      })
    if (error) throw error

    return generatedImage
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}
