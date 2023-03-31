import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw6'
const BACKGROUND_IMAGE_STD = `${STORAGE_URL}/lw6_ticket_regular.png?prod=true&v=2`
const BACKGROUND_IMAGE_GOLDEN = `${STORAGE_URL}/lw6_ticket_gold.png?prod=true&v=2`
const SUPA_CHECKMARK = `${STORAGE_URL}/supaverified.png?prod=true&v=2`
const SUPA_CHECKMARK_GOLD = `${STORAGE_URL}/supaverified_gold.png?prod=true&v=2`

// Load custom font
const FONT_URL = `${STORAGE_URL}/CircularStd-Book.otf?prod=true&v=2`
const font = fetch(new URL(FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())

export async function handler(req: Request) {
  const url = new URL(req.url)
  const username = url.searchParams.get('username') ?? url.searchParams.get('amp;username')
  const userAgent = req.headers.get('user-agent')

  try {
    if (!username) throw new Error('missing username param')
    // Track social shares
    const supabaseAdminClient = createClient(
      // Supabase API URL - env var exported by default when deployed.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    if (userAgent?.toLocaleLowerCase().includes('twitter')) {
      const { error } = await supabaseAdminClient
        .from('lw6_tickets')
        .update({ sharedOnTwitter: true })
        .eq('username', username)
      if (error) console.log(error.message)
    } else if (userAgent?.toLocaleLowerCase().includes('linkedin')) {
      const { error } = await supabaseAdminClient
        .from('lw6_tickets')
        .update({ sharedOnLinkedIn: true })
        .eq('username', username)
      if (error) console.log(error.message)
    }

    // Try to get image from Supabase Storage CDN.
    const storageResponse = await fetch(`${STORAGE_URL}/tickets/${username}.png?prod=true&v=5`)
    if (storageResponse.ok) return storageResponse

    // Get ticket data
    const { data, error } = await supabaseAdminClient
      .from('lw6_tickets_golden')
      .select('name, ticketNumber, golden')
      .eq('username', username)
      .maybeSingle()
    if (error) throw error

    if (!data?.ticketNumber) throw new Error('missing data')
    const { name, ticketNumber } = data
    const golden = data?.golden ?? false

    // Else, generate image ad upload to storage.
    const fontData = await font
    const numDigits = `${Number(ticketNumber)}`.length
    const prefix = `00000000`.slice(numDigits)

    const generatedImage = new ImageResponse(
      (
        <>
          <div
            style={{
              width: '1200px',
              height: '630px',
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
              width="1200"
              height="630"
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
              width="200"
              height="200"
              style={{
                position: 'absolute',
                top: '215',
                left: '155',
                borderRadius: 100,
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
                top: '215',
                left: '400',
                width: '550',
                height: '200',
                overflow: 'hidden',
                textOverflow: 'clip',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  color: 'transparent',
                  backgroundImage:
                    'linear-gradient(90deg, #F8F9FA 1.73%, rgba(248, 249, 250, 0.5) 100%)',
                  backgroundClip: 'text',
                }}
              >
                <p
                  style={{
                    fontSize: '60px',
                    lineHeight: '60px',
                  }}
                >
                  {name ?? username}
                </p>
              </div>
              {/* Username and supaverified checkmark */}
              <div
                style={{
                  display: 'flex',
                  fontSize: '25',
                  color: golden ? '#fff' : '#A0A0A0',
                }}
              >
                <span>{`@${username}`}</span>
                <span
                  style={{
                    marginTop: '2',
                    marginLeft: '10',
                  }}
                >
                  <img width="32" height="32" src={golden ? SUPA_CHECKMARK_GOLD : SUPA_CHECKMARK} />
                </span>
              </div>
            </div>
            {/* Date  */}
            <p
              style={{
                position: 'absolute',
                top: '520',
                left: '400',
                fontSize: '22',
                color: golden ? '#fff' : '#A0A0A0',
              }}
            >
              December 12th 2022
            </p>
            {/* URL  */}
            <p
              style={{
                position: 'absolute',
                top: '520',
                left: '680',
                fontSize: '22',
                color: golden ? '#fff' : '#A0A0A0',
              }}
            >
              supabase.com/launch-week
            </p>
          </div>
          {/* Ticket No  */}
          <div
            style={{
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              bottom: '225',
              right: '-165',
              width: '575',
              height: '175',
              transform: 'rotate(90deg)',
            }}
          >
            <p
              style={{
                fontSize: '70',
              }}
            >
              {`No ${prefix}${ticketNumber}`}
            </p>
          </div>
        </>
      ),
      {
        width: 1200,
        height: 630,
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

    // Upload image to storage.
    const { error: storageError } = await supabaseAdminClient.storage
      .from('images')
      .upload(`lw6/tickets/${username}.png`, generatedImage.body!, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: false,
      })
    if (storageError) throw storageError

    return generatedImage
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}
