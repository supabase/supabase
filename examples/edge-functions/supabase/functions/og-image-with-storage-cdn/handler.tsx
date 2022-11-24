import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw6'
const BACKGROUND_IMAGE_STD = `${STORAGE_URL}/lw6_ticket_regular.jpg`
const BACKGROUND_IMAGE_GOLDEN = `${STORAGE_URL}/lw6_ticket_gold.jpg`
const SUPA_CHECKMARK = `${STORAGE_URL}/supaverified.png`

// Load custom font
const FONT_URL = `${STORAGE_URL}/CircularStd-Bold.otf`
const font = fetch(new URL(FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())

export async function handler(req: Request) {
  const url = new URL(req.url)
  const ticketNumber = url.searchParams.get('ticketNumber')
  const username = url.searchParams.get('username') ?? url.searchParams.get('amp;username')
  const name = url.searchParams.get('name') ?? url.searchParams.get('amp;name')
  const golden = url.searchParams.get('golden') ?? url.searchParams.get('amp;golden')

  if (!username || !ticketNumber || !name)
    return new Response(JSON.stringify({ error: 'missing params' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })

  try {
    // Try to get image from Supabase Storage CDN.
    const storageResponse = await fetch(`${STORAGE_URL}/tickets/${username}.png?version=dev`) // TODO change for prod.
    if (storageResponse.ok) return storageResponse

    // Else, generate image ad upload to storage.
    const fontData = await font
    const numDigits = `${Number(ticketNumber)}`.length
    const prefix = `00000000`.slice(numDigits)

    const generatedImage = new ImageResponse(
      (
        <div
          style={{
            width: '2000px',
            height: '1000px',
            backgroundColor: '#000',
            color: '#fff',
            fontFamily: '"Circular"',
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
            width="270"
            height="270"
            style={{
              position: 'absolute',
              top: '360',
              left: '460',
              borderRadius: 135,
            }}
            src={`https://github.com/${username}.png`}
          />
          {/* Name & username */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column',
              position: 'absolute',
              top: '360',
              left: '815',
              width: '600',
              height: '270',
              overflow: 'hidden',
              textOverflow: 'clip',
            }}
          >
            <p
              style={{
                fontSize: '70',
                lineHeight: 0.9,
              }}
            >
              {name}
            </p>
            {/* Username and supaverified checkmark */}
            <div
              style={{
                display: 'flex',
                fontSize: '35',
              }}
            >
              <span>{`@${username}`}</span>
              <span
                style={{
                  marginTop: '5',
                  marginLeft: '10',
                }}
              >
                <img width="44" height="44" src={SUPA_CHECKMARK} />
              </span>
            </div>
          </div>
          {/* Date  */}
          <p
            style={{
              position: 'absolute',
              top: '750',
              left: '815',
              fontSize: '25',
            }}
          >
            December 12th, 2022
          </p>
          {/* URL  */}
          <p
            style={{
              position: 'absolute',
              top: '750',
              left: '1120',
              fontSize: '25',
            }}
          >
            supabase.com/launch-week
          </p>
          {/* Ticket No  */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              bottom: '385',
              right: '60',
              width: '705',
              height: '215',
              transform: 'rotate(90deg)',
            }}
          >
            <p
              style={{
                fontSize: '80',
              }}
            >
              {`№ ${prefix}${ticketNumber}`}
            </p>
          </div>
        </div>
      ),
      {
        width: 2000,
        height: 1000,
        fonts: [
          {
            name: 'Circular',
            data: fontData,
            style: 'normal',
          },
        ],
        headers: {
          'content-type': 'image/png',
          'cache-control': 'public, max-age=31536000, s-maxage=31536000, no-transform, immutable',
          'cdn-cache-control': 'max-age=31536000',
        },
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
      .upload(`lw6/tickets/${username}.png`, generatedImage.body!, {
        // cacheControl: '31536000', // TODO add for prod
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
