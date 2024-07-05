import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lwx'
const BUCKET_FOLDER_VERSION = 'v1'

export async function handler(req: Request) {
  try {
    if (req.method !== 'POST') throw new Error('method not supported')
    const {
      username = 'fsansalvadore',
      platinum = false,
    }: {
      username: string
      platinum?: boolean
    } = await req.json()

    const timestamp = encodeURI(new Date().toISOString())
    const ticketImg = `${STORAGE_URL}/tickets/${
      platinum ? 'platinum' : 'regular'
    }/${BUCKET_FOLDER_VERSION}/${username}.png?t=${timestamp}`

    const ticketWidth = 1100
    const ticketHeight = ticketWidth / 2
    const BG = {
      REG: `${STORAGE_URL}/assets/og_bg_regular.png`,
      PLATINUM: `${STORAGE_URL}/assets/og_bg_platinum.png`,
    }

    const geneartedOGImage = new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '628px',
            position: 'relative',
            backgroundImage: BG[platinum ? 'PLATINUM' : 'REG'],
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            padding: '60px',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Ticket  */}
          <img
            width={ticketWidth}
            height={ticketHeight}
            src={ticketImg}
            style={{
              borderRadius: '26px',
              boxShadow: '0px 4px 25px rgba(0, 0, 0, 0.2)',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 628,
        headers: {
          'content-type': 'image/png',
          'cache-control': 'public, max-age=31536000, s-maxage=31536000, no-transform, immutable',
          'cdn-cache-control': 'max-age=31536000',
        },
      }
    )

    // Upload image to storage.
    const supabaseAdminClient = createClient(
      // Supabase API URL - env var exported by default when deployed.
      Deno.env.get('MISC_USE_URL') ?? '',
      // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
      Deno.env.get('MISC_USE_ANON_KEY') ?? ''
    )

    // return geneartedOGImage
    const { error: storageError } = await supabaseAdminClient.storage
      .from('images')
      .upload(
        `lwx/og/${platinum ? 'platinum' : 'regular'}/${BUCKET_FOLDER_VERSION}/${username}.png`,
        geneartedOGImage.body!,
        {
          contentType: 'image/png',
          cacheControl: '0',
          upsert: true,
        }
      )

    if (storageError) throw new Error(`storageError: ${storageError.message}`)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}
