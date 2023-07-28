import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw7'

// Load custom font
const FONT_URL = `${STORAGE_URL}/CircularStd-Book.otf`
const font = fetch(new URL(FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())
const BUCKET_FOLDER_VERSION = 'v3'

export async function handler(req: Request) {
  const url = new URL(req.url)
  const username = url.searchParams.get('username') ?? url.searchParams.get('amp;username')
  const assumeGolden = url.searchParams.get('golden') ?? url.searchParams.get('amp;golden')
  const userAgent = req.headers.get('user-agent')

  try {
    if (!username) throw new Error('missing username param')
    // Track social shares
    const supabaseAdminClient = createClient(
      // iEchor API URL - env var exported by default when deployed.
      Deno.env.get('IECHOR_URL') ?? '',
      // iEchor API SERVICE ROLE KEY - env var exported by default when deployed.
      Deno.env.get('IECHOR_SERVICE_ROLE_KEY') ?? ''
    )
    if (userAgent?.toLocaleLowerCase().includes('twitter')) {
      await supabaseAdminClient
        .from('lw7_tickets')
        .update({ sharedOnTwitter: 'now' })
        .eq('username', username)
        .is('sharedOnTwitter', null)
    } else if (userAgent?.toLocaleLowerCase().includes('linkedin')) {
      await supabaseAdminClient
        .from('lw7_tickets')
        .update({ sharedOnLinkedIn: 'now' })
        .eq('username', username)
        .is('sharedOnLinkedIn', null)
    }

    // Try to get image from iEchor Storage CDN.
    let storageResponse: Response
    storageResponse = await fetch(
      `${STORAGE_URL}/tickets/golden/${BUCKET_FOLDER_VERSION}/${username}.png`
    )
    if (storageResponse.ok) return storageResponse
    storageResponse = await fetch(
      `${STORAGE_URL}/tickets/regular/${BUCKET_FOLDER_VERSION}/${username}.png`
    )
    if (!assumeGolden && storageResponse.ok) return storageResponse

    // Get ticket data
    const { data, error } = await supabaseAdminClient
      .from('lw7_tickets_golden')
      .select('name, ticketNumber, golden, bg_image_id')
      .eq('username', username)
      .maybeSingle()
    if (error) console.log(error.message)
    if (!data) throw new Error('user not found')
    const { name, ticketNumber, bg_image_id } = data
    const golden = data?.golden ?? false

    if (assumeGolden && !golden) return await fetch(`${STORAGE_URL}/golden_no_meme.png`)

    // Else, generate image ad upload to storage.
    const BACKGROUND = {
      REG: {
        BG: `${STORAGE_URL}/reg_bg.png`,
        AI: `${STORAGE_URL}/tickets_bg/blurred/regular/png/reg_bg_${bg_image_id ?? '1'}.png`,
        TICKET: `${STORAGE_URL}/reg_ticket.png`,
      },
      GOLD: {
        BG: `${STORAGE_URL}/gold_bg.png`,
        AI: `${STORAGE_URL}/tickets_bg/blurred/golden/png/gold_bg_${bg_image_id ?? '1'}.png`,
        TICKET: `${STORAGE_URL}/gold_ticket.png`,
      },
    }

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
              color: '#F8F9FA',
              fontFamily: '"Circular"',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Background gradient  */}
            <img
              width="1200"
              height="630"
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                zIndex: '-9000',
              }}
              src={golden ? BACKGROUND['GOLD']['BG'] : BACKGROUND['REG']['BG']}
            />
            {/* Background ai  */}
            <img
              width="1027"
              height="524"
              style={{
                borderRadius: '24px',
                position: 'absolute',
                objectFit: 'cover',
                top: '53',
                left: '87',
                zIndex: '-8000',
              }}
              src={golden ? BACKGROUND['GOLD']['AI'] : BACKGROUND['REG']['AI']}
            />
            {/* Background ticket  */}
            <img
              width="1089"
              height="586"
              style={{
                position: 'absolute',
                top: '22',
                left: '56',
                zIndex: '-7000',
              }}
              src={golden ? BACKGROUND['GOLD']['TICKET'] : BACKGROUND['REG']['TICKET']}
            />
            {/* GitHub Avatar image */}
            <img
              width="166"
              height="166"
              style={{
                position: 'absolute',
                top: '210',
                left: '484',
                borderRadius: 83,
              }}
              src={`https://github.com/${username}.png`}
            />
            {/* Name & username */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                position: 'absolute',
                top: '350',
                left: '210',
                width: '727',
                height: '200',
                overflow: 'hidden',
                textOverflow: 'clip',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  color: 'transparent',
                  backgroundImage:
                    'linear-gradient(90deg, rgba(248, 249, 250, 0.66) -31.69%, #F8F9FA 22.14%, rgba(248, 249, 250, 0.5) 122.78%)',
                  backgroundClip: 'text',
                }}
              >
                <p
                  style={{
                    margin: '0',
                    fontSize: '50px',
                    lineHeight: '65px',
                  }}
                >
                  {name ?? username}
                </p>{' '}
              </div>

              {/* Username */}
              <div
                style={{
                  color: '#EDEDED',
                  opacity: 0.8,
                  display: 'flex',
                  fontSize: '20',
                  marginTop: '0px',
                }}
              >
                <span>{`@${username}`}</span>
              </div>
            </div>
          </div>
          {/* Ticket No  */}
          <div
            style={{
              color: '#F8F9FA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              bottom: '225',
              right: '-130',
              width: '575',
              height: '175',
              transform: 'rotate(90deg)',
              opacity: 0.8,
            }}
          >
            <p
              style={{
                fontSize: '60',
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
      .upload(
        `lw7/tickets/${golden ? 'golden' : 'regular'}/${BUCKET_FOLDER_VERSION}/${username}.png`,
        generatedImage.body!,
        {
          contentType: 'image/png',
          cacheControl: '31536000',
          upsert: false,
        }
      )
    if (storageError) throw new Error(`storageError: ${storageError.message}`)
    // Generate image for gallery
    fetch('https://obuldanrptloktxcffvn.functions.supabase.co/lw7-ticket-gallery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idWxkYW5ycHRsb2t0eGNmZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk3MjcwMTIsImV4cCI6MTk4NTMwMzAxMn0.SZLqryz_-stF8dgzeVXmzZWPOqdOrBwqJROlFES8v3I',
      },
      body: JSON.stringify({
        username,
        name,
        ticketNumber,
        bg_image_id,
        golden,
      }),
    })

    return await fetch(
      `${STORAGE_URL}/tickets/${
        golden ? 'golden' : 'regular'
      }/${BUCKET_FOLDER_VERSION}/${username}.png`
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}
