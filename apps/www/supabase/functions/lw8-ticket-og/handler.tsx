import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw8'

const BUCKET_FOLDER_VERSION = 'v1'

export async function handler(req: Request) {
  try {
    if (req.method !== 'POST') throw new Error('method not supported')
    const {
      username = 'thorwebdev',
      golden = false,
    }: {
      username?: string
      golden?: boolean
    } = await req.json()

    // Else, generate image and upload to storage.
    const timestamp = encodeURI(new Date().toISOString())
    const ticketImg = `${STORAGE_URL}/tickets/${
      golden ? 'golden' : 'regular'
    }/${BUCKET_FOLDER_VERSION}/${username}.png?t=${timestamp}`

    const bgImg = `${STORAGE_URL}/assets/backgrounds/og-${golden ? 'golden' : 'regular'}.png`
    const ticketWidth = 1100
    const ticketHeight = ticketWidth / 2
    const boxOffset = 24
    const boxWidth = `${ticketWidth + boxOffset}px`
    const boxHeight = `${ticketHeight + boxOffset}px`
    const leftOffset = `${(1200 - ticketWidth) / 2 - boxOffset / 2}px`
    const topOffset = `${(628 - ticketHeight) / 2 - boxOffset / 2}px`

    const geneartedOGImage = new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '628px',
            position: 'relative',
            backgroundColor: '#141414',
            color: '#F8F9FA',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            padding: '60px',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Background  */}
          <img
            width="1200"
            height="628"
            src={bgImg}
            style={{
              position: 'absolute',
              top: '-1px',
              bottom: '-1px',
              left: '-1px',
              right: '-1px',
              zIndex: '-999',
            }}
          />
          {/* Ticket Box */}
          <div
            style={{
              width: boxWidth,
              height: boxHeight,
              position: 'absolute',
              top: topOffset,
              left: leftOffset,
              zIndex: '-1',
              margin: 'auto',
              borderRadius: '36px',
              background: golden ? 'rgba(3, 3, 3, 0.13)' : 'rgba(5, 9, 14, 0.10)',
              boxShadow: golden
                ? 'inset 0.25px 0.3px 0px 0.3px rgba(253, 234, 137, 0.4), 0px 0px 11px 0px #FDEA89'
                : 'inset 0.25px 0.3px 0px 0.3px rgba(255, 255, 255, 0.4), 0px 0px 11px 0px #440E77',
            }}
          />
          {/* Ticket  */}
          <img
            width={ticketWidth}
            height={ticketHeight}
            src={ticketImg}
            style={{
              borderRadius: '26px',
              boxShadow:
                '0px 1px 27px rgba(158, 68, 239, 0.06), 0 80px 40#222022cc 21, 0.8), inset 0 0.2px 1px 0.2px rgba(214, 210, 210, 0.4), inset 0.4px 0.4px 1px 0.3px rgba(210, 231, 229, 0.2)',
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
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const { error: storageError } = await supabaseAdminClient.storage
      .from('images')
      .upload(
        `lw8/og/${golden ? 'golden' : 'regular'}/${BUCKET_FOLDER_VERSION}/${username}.png`,
        geneartedOGImage.body!,
        {
          contentType: 'image/png',
          cacheControl: '0',
          upsert: true,
        }
      )
    if (storageError) throw new Error(`storageError: ${storageError.message}`)
    // return geneartedOGImage

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
