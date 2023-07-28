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
  try {
    if (req.method !== 'POST') throw new Error('method not supported')
    const {
      username = 'thorwebdev',
      name = 'Thoggen Schaeppy',
      ticketNumber = 1234,
      golden = true,
      bg_image_id = 80,
    }: {
      username?: string
      name?: string
      ticketNumber?: number
      golden?: boolean
      bg_image_id?: number
    } = await req.json()

    // Else, generate image ad upload to storage.
    const BACKGROUND = {
      REG: {
        AI: `${STORAGE_URL}/tickets_bg/blurred/regular/png/reg_bg_${bg_image_id}.png`,
        TICKET: `${STORAGE_URL}/reg_ticket_overlay.png`,
      },
      GOLD: {
        AI: `${STORAGE_URL}/tickets_bg/blurred/golden/png/gold_bg_${bg_image_id}.png`,
        TICKET: `${STORAGE_URL}/gold_ticket_overlay.png`,
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
              width: '1027px',
              height: '520px',
              backgroundColor: '#000',
              color: '#F8F9FA',
              fontFamily: '"Circular"',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Background ai  */}
            <img
              width="1027"
              height="520"
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                objectFit: 'cover',
                zIndex: '-8000',
              }}
              src={golden ? BACKGROUND['GOLD']['AI'] : BACKGROUND['REG']['AI']}
            />
            {/* Background ticket  */}
            <img
              width="1027"
              height="520"
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
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
                top: '145',
                left: '400',
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
                top: '285',
                left: '200',
                width: '570',
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
                    lineHeight: '62px',
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
              bottom: '175',
              right: '-210',
              width: '575',
              height: '175',
              transform: 'rotate(90deg)',
              opacity: 0.8,
            }}
          >
            <p
              style={{
                fontSize: '66',
              }}
            >
              {`No ${prefix}${ticketNumber}`}
            </p>
          </div>
        </>
      ),
      {
        width: 1027,
        height: 520,
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
    const supabaseAdminClient = createClient(
      // iEchor API URL - env var exported by default when deployed.
      Deno.env.get('IECHOR_URL') ?? '',
      // iEchor API SERVICE ROLE KEY - env var exported by default when deployed.
      Deno.env.get('IECHOR_SERVICE_ROLE_KEY') ?? ''
    )
    const { error: storageError } = await supabaseAdminClient.storage
      .from('images')
      .upload(
        `lw7/tickets/gallery/${
          golden ? 'golden' : 'regular'
        }/${BUCKET_FOLDER_VERSION}/${username}.png`,
        generatedImage.body!,
        {
          contentType: 'image/png',
          cacheControl: '31536000',
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
