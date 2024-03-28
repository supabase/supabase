import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw11'

// Load custom font
const FONT_URL = `${STORAGE_URL}/assets/font/CircularStd-Book.otf`
const MONO_FONT_URL = `${STORAGE_URL}/assets/font/SourceCodePro-Regular.ttf`
const font = fetch(new URL(FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())
const mono_font = fetch(new URL(MONO_FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())
// const BUCKET_FOLDER_VERSION = 'v1'

const LW_TABLE = 'lw11_tickets'
const LW_MATERIALIZED_VIEW = 'lw11_tickets_platinum'

const STYLING_CONGIF = {
  regular: {
    BACKGROUND: '#060809',
    FOREGROUND: '#F8F9FA',
    FOREGROUND_LIGHT: '#8B9092',
    TICKET_FOREGROUND: '#F8F9FA',
    TICKET_FOREGROUND_LIGHT: '#8B9092',
    BORDER: '#303030',
  },
  platinum: {
    BACKGROUND: '#f1f1f1',
    FOREGROUND: '#11181C',
    FOREGROUND_LIGHT: '#6c7277',
    TICKET_FOREGROUND: '#11181C',
    TICKET_FOREGROUND_LIGHT: '#6c7277',
    BORDER: '#303030',
  },
  secret: {
    BACKGROUND: '#060809',
    FOREGROUND: '#F8F9FA',
    FOREGROUND_LIGHT: '#8B9092',
    TICKET_FOREGROUND: '#F8F9FA',
    TICKET_FOREGROUND_LIGHT: '#F8F9FA',
    BORDER: '#303030',
  },
}

export async function handler(req: Request) {
  const url = new URL(req.url)
  const username = url.searchParams.get('username') ?? url.searchParams.get('amp;username')
  const assumePlatinum = url.searchParams.get('platinum') ?? url.searchParams.get('amp;platinum')
  const userAgent = req.headers.get('user-agent')

  try {
    if (!username) throw new Error('missing username param')

    const supabaseAdminClient = createClient(
      // Supabase API URL - env var exported by default when deployed.
      Deno.env.get('MISC_USE_URL') ?? '',
      // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
      Deno.env.get('MISC_USE_ANON_KEY') ?? ''
    )

    // Track social shares
    if (userAgent?.toLocaleLowerCase().includes('twitter')) {
      await supabaseAdminClient
        .from(LW_TABLE)
        .update({ sharedOnTwitter: 'now' })
        .eq('username', username)
        .is('sharedOnTwitter', null)
    } else if (userAgent?.toLocaleLowerCase().includes('linkedin')) {
      await supabaseAdminClient
        .from(LW_TABLE)
        .update({ sharedOnLinkedIn: 'now' })
        .eq('username', username)
        .is('sharedOnLinkedIn', null)
    }

    // Get ticket data
    const { data, error } = await supabaseAdminClient
      .from(LW_MATERIALIZED_VIEW)
      .select('name, ticketNumber, sharedOnTwitter, sharedOnLinkedIn, metadata')
      .eq('username', username)
      .maybeSingle()

    if (error) console.log('fetch error', error.message)
    if (!data) throw new Error(error?.message ?? 'user not found')
    const { name, ticketNumber, metadata } = data

    const platinum = (!!data?.sharedOnTwitter && !!data?.sharedOnLinkedIn) ?? false
    if (assumePlatinum && !platinum) return await fetch(`${STORAGE_URL}/assets/golden_no_meme.png`)

    // Generate image and upload to storage.
    const ticketType = data.metadata?.hasSecretTicket ? 'secret' : platinum ? 'platinum' : 'regular'

    const fontData = await font
    const monoFontData = await mono_font
    const numDigits = `${Number(ticketNumber)}`.length
    // const prefix = `00000000`.slice(numDigits)
    const HAS_ROLE = !!metadata?.role
    const HAS_COMPANY = !!metadata?.company
    const HAS_LOCATION = !!metadata?.location
    const HAS_NO_META = !HAS_ROLE && !HAS_COMPANY && !HAS_LOCATION
    const OG_WIDTH = 1200
    const OG_HEIGHT = 628
    const OG_PADDING_X = 60
    const OG_PADDING_Y = 60
    const TICKET_WIDTH = 600
    const TICKET_RATIO = 396 / 613
    const TICKET_HEIGHT = TICKET_WIDTH / TICKET_RATIO
    const TICKET_POS_TOP = OG_PADDING_Y
    const TICKET_POS_LEFT = 500
    const TICKET_PADDING_X = 40
    const TICKET_PADDING_Y = 40
    const LOGO_WIDTH = 160
    const LOGO_RATIO = 145 / 79
    // Select one of 30 pre generated bg images base on ticket number
    const BG_NUMBER = `000${(ticketNumber % 30) + 1}`.slice(-3)

    const BACKGROUND = {
      regular: {
        OG: `${STORAGE_URL}/assets/backgrounds/regular/${BG_NUMBER}.png`,
        BG: `${STORAGE_URL}/assets/lw11_ticket_regular_darker.png`,
        LOGO: `${STORAGE_URL}/assets/lw11_logo_white.svg`,
      },
      platinum: {
        OG: `${STORAGE_URL}/assets/backgrounds/platinum/${BG_NUMBER}.png`,
        BG: `${STORAGE_URL}/assets/lw11_ticket_platinum.png`,
        LOGO: `${STORAGE_URL}/assets/lw11_logo_black.svg`,
      },
      secret: {
        OG: `${STORAGE_URL}/assets/backgrounds/secret/${BG_NUMBER}.png`,
        BG: `${STORAGE_URL}/assets/lw11_ticket_gold.png?t=a`,
        LOGO: `${STORAGE_URL}/assets/lw11_logo_white.svg`,
      },
    }

    const generatedTicketImage = new ImageResponse(
      (
        <>
          <div
            style={{
              width: '1200px',
              height: '628px',
              position: 'relative',
              fontFamily: '"Circular"',
              color: STYLING_CONGIF[ticketType].FOREGROUND,
              backgroundColor: STYLING_CONGIF[ticketType].BACKGROUND,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: '60px',
              justifyContent: 'space-between',
            }}
          >
            {/* Background  */}
            <img
              width="1202"
              height="632"
              style={{
                position: 'absolute',
                top: '-1px',
                left: '-1px',
                bottom: '-1px',
                right: '-1px',
                zIndex: '0',
                background: STYLING_CONGIF[ticketType].BACKGROUND,
              }}
              src={BACKGROUND[ticketType].OG}
            />
            {/* Ticket  */}
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                zIndex: '1',
                top: TICKET_POS_TOP,
                left: TICKET_POS_LEFT,
                width: TICKET_WIDTH,
                height: TICKET_HEIGHT,
                margin: 0,
                borderRadius: '26px',
                // border: `1px solid blue`,
                boxShadow: '0px 4px 45px rgba(0, 0, 0, 0.1)',
              }}
            >
              <img
                width={TICKET_WIDTH}
                height={TICKET_HEIGHT}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: '1',
                  margin: 0,
                  borderRadius: '26px',
                  border: `1px solid ${STYLING_CONGIF[ticketType].BORDER}`,
                  // boxShadow: '0px 0px 50px rgba(0, 0, 0, 0.25)',
                }}
                src={BACKGROUND[ticketType].BG}
              />

              {/* Name & username */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  position: 'absolute',
                  top: TICKET_PADDING_Y + 100,
                  left: TICKET_PADDING_X,
                  width: TICKET_WIDTH - TICKET_PADDING_X * 2,
                  height: 'auto',
                  overflow: 'hidden',
                  textOverflow: 'clip',
                  textAlign: 'left',
                  marginBottom: '10px',
                }}
              >
                <p
                  style={{
                    color: STYLING_CONGIF[ticketType].TICKET_FOREGROUND,
                    margin: '0',
                    padding: '0',
                    fontSize: '56',
                    lineHeight: '105%',
                    display: 'flex',
                    marginBottom: '6px',
                  }}
                >
                  {name ?? username}
                </p>

                <div
                  style={{
                    color: STYLING_CONGIF[ticketType].TICKET_FOREGROUND_LIGHT,
                    opacity: 0.8,
                    display: 'flex',
                    fontSize: '32',
                    margin: '0',
                  }}
                >
                  {HAS_NO_META && username && `@${username}`}
                  {HAS_ROLE && `${metadata.role}`}
                  {HAS_COMPANY && `${HAS_ROLE ? ' at ' : ''}${metadata.company} `}
                </div>
              </div>
            </div>
            {/* Ticket No  */}
            {/* <p
              style={{
                display: 'flex',
                position: 'absolute',
                bottom: TICKET_PADDING_Y,
                left: TICKET_PADDING_X + TICKET_POS_LEFT,
                width: '50%',
                color: STYLING_CONGIF[ticketType].TICKET_FOREGROUND_LIGHT,
                margin: '0',
                marginBottom: '5',
                fontFamily: '"SourceCodePro"',
                fontSize: '23',
                textTransform: 'uppercase',
                letterSpacing: '0.35rem',
                lineHeight: '120%',
                // border: '1px solid white',
              }}
            >
              {`NO ${prefix}${ticketNumber}`}
            </p> */}

            <div
              style={{
                position: 'absolute',
                top: OG_PADDING_Y,
                left: OG_PADDING_X,
                bottom: OG_PADDING_Y,
                display: 'flex',
                flexDirection: 'column',
                width: TICKET_POS_LEFT - OG_PADDING_X,
                alignItems: 'flex-start',
                fontFamily: '"SourceCodePro"',
                fontSize: 30,
                textTransform: 'uppercase',
                letterSpacing: '0.35rem',
                lineHeight: '120%',
              }}
            >
              <div style={{ display: 'flex', marginBottom: '40' }}>
                <img
                  src={BACKGROUND[ticketType].LOGO}
                  width={LOGO_WIDTH}
                  height={LOGO_WIDTH / LOGO_RATIO}
                />
              </div>

              <p
                style={{
                  margin: '0',
                }}
              >
                April 11th
              </p>
              <p
                style={{
                  display: 'flex',
                  margin: 0,
                  color: STYLING_CONGIF[ticketType].FOREGROUND_LIGHT,
                }}
              >
                8AM PT
              </p>
            </div>
          </div>
        </>
      ),
      {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        fonts: [
          {
            name: 'Circular',
            data: fontData,
            style: 'normal',
          },
          {
            name: 'SourceCodePro',
            data: monoFontData,
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
      .upload(`lw11/og/${ticketType}/${username}.png`, generatedTicketImage.body!, {
        contentType: 'image/png',
        // cacheControl: `${60 * 60 * 24 * 7}`,
        cacheControl: `0`,
        // Update cached og image, people might need to update info
        upsert: true,
      })

    if (storageError) throw new Error(`storageError: ${storageError.message}`)

    const NEW_TIMESTAMP = new Date()

    return await fetch(`${STORAGE_URL}/og/${ticketType}/${username}.png?t=${NEW_TIMESTAMP}`)
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}
