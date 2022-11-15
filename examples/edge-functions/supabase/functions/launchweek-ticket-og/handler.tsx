import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.2/mod.ts'
import { corsHeaders } from '../_shared/cors.ts'

const BACKGROUND_IMAGE_STD =
  'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw6/lw6_ticket_background.png'
const BACKGROUND_IMAGE_GOLDEN =
  'https://pbs.twimg.com/profile_banners/1219566488325017602/1662536044/1500x500'
const SUPA_CHECKMARK =
  'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw6/supaverified.png'

export function handler(req: Request) {
  const url = new URL(req.url)
  const ticketNumber = url.searchParams.get('ticketNumber')
  const username = url.searchParams.get('username')
  const name = url.searchParams.get('name')
  const golden = url.searchParams.get('golden')

  if (!username || !ticketNumber || !name)
    return new Response(JSON.stringify({ error: 'missing params' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: '2000px',
            height: '1000px',
            backgroundColor: '#000',
            color: '#fff',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Background image  */}
          <img
            width="2000"
            height="1000"
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              zIndex: '-9000',
            }}
            src={golden ? BACKGROUND_IMAGE_GOLDEN : BACKGROUND_IMAGE_STD}
          />
          {/* GitHub Avatar image */}
          <img
            width="380"
            height="380"
            style={{
              position: 'absolute',
              top: '310',
              left: '250',
              borderRadius: 190,
            }}
            src={`https://github.com/${username}.png`}
          />
          {/* Name */}
          <p
            style={{
              position: 'absolute',
              top: '320',
              left: '740',
              fontSize: '100',
              maxWidth: '880',
            }}
          >
            {name}
          </p>
          {/* Username and supaverified checkmark */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: '605',
              left: '735',
              fontSize: '50',
            }}
          >
            <span>{`@${username}`}</span>
            <span
              style={{
                marginTop: '5',
                marginLeft: '10',
              }}
            >
              <img width="50" height="50" src={SUPA_CHECKMARK} />
            </span>
          </div>
        </div>
      ),
      {
        width: 2000,
        height: 1000,
        headers: {
          'content-type': 'image/png',
          'cache-control': 'public, max-age=31536000, no-transform, immutable',
        },
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}
