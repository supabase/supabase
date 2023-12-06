import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lwx'

// Load custom font
const FONT_URL = `${STORAGE_URL}/font/CircularStd-Book.otf`
const MONO_FONT_URL = `${STORAGE_URL}/font/SourceCodePro-Regular.ttf?t=2023-07-18T13%3A03%3A29.474Z`
const font = fetch(new URL(FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())
const mono_font = fetch(new URL(MONO_FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())
const BUCKET_FOLDER_VERSION = 'v1'

const LW_TABLE = 'lwx_tickets'
const LW_MATERIALIZED_VIEW = 'lwx_tickets_golden'

const STYLING_CONGIF = {
  regular: {
    BACKGROUND: '#303030',
    FOREGROUND: '#F8F9FA',
    FOREGROUND_LIGHT: '#8B9092',
    BORDER: '#303030',
  },
  platinum: {
    BACKGROUND: '#f1f1f1',
    FOREGROUND: '#11181C',
    FOREGROUND_LIGHT: '#6c7277',
    BORDER: '#CFCFCF',
  },
  secret: {
    BACKGROUND: '#f1f1f1',
    FOREGROUND: '#11181C',
    FOREGROUND_LIGHT: '#6c7277',
    BORDER: '#CFCFCF',
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
    const ticketType = data.metadata?.hasSecretTicket ? 'secret' : platinum ? 'platinum' : 'regular'

    // Else, generate image and upload to storage.
    const BACKGROUND = {
      regular: {
        OG: `${STORAGE_URL}/assets/og_bg_regular.png?t=2023-11-27T22%3A32%3A21.973Z`,
        BG: `${STORAGE_URL}/assets/lwx_ticket_bg_regular.png`,
        LOGO: `${STORAGE_URL}/assets/logos/supabase_logo_reg.png`,
        // LOGO: `${STORAGE_URL}/assets/logos/supabase_lwx_logo_dark.png`,
      },
      platinum: {
        OG: `${STORAGE_URL}/assets/og_bg_platinum.png?t=2023-11-27T22%3A31%3A58.719Z`,
        BG: `${STORAGE_URL}/assets/lwx_ticket_bg_platinum.png`,
        LOGO: `${STORAGE_URL}/assets/logos/supabase_logo_platinum.png`,
        // LOGO: `${STORAGE_URL}/assets/logos/supabase_lwx_logo_light.png`,
      },
      secret: {
        OG: `${STORAGE_URL}/assets/og_bg_secret.png?t=2023-11-27T22%3A31%3A58.719Z`,
        BG: `${STORAGE_URL}/assets/lwx_ticket_bg_secret.png`,
        LOGO: `${STORAGE_URL}/assets/logos/supabase_logo_platinum.png`,
        // LOGO: `${STORAGE_URL}/assets/logos/supabase_lwx_logo_light.png`,
      },
    }

    const fontData = await font
    const monoFontData = await mono_font
    const numDigits = `${Number(ticketNumber)}`.length
    const prefix = `00000000`.slice(numDigits)
    const HAS_ROLE = !!metadata?.role
    const HAS_COMPANY = !!metadata?.company
    const HAS_LOCATION = !!metadata?.location
    const HAS_NO_META = !HAS_ROLE && !HAS_COMPANY && !HAS_LOCATION
    const OG_WIDTH = 1200
    const OG_HEIGHT = 628
    const TICKET_WIDTH = 1000
    const TICKET_HEIGHT = TICKET_WIDTH / 2
    const TICKET_PADDING_X = 60
    const TICKET_PADDING_Y = 60
    const OG_PADDING_X = (OG_WIDTH - TICKET_WIDTH) / 2
    const OG_PADDING_Y = (OG_HEIGHT - TICKET_HEIGHT) / 2

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
              }}
              src={BACKGROUND[ticketType].OG}
            />
            {/* Ticket  */}
            <img
              width={TICKET_WIDTH}
              height={TICKET_HEIGHT}
              style={{
                position: 'absolute',
                top: OG_PADDING_Y,
                left: OG_PADDING_X,
                bottom: 0,
                right: '0',
                zIndex: '1',
                margin: 'auto',
                borderRadius: '20px',
                border: `1px solid ${STYLING_CONGIF[ticketType].BORDER}`,
                boxShadow: '0px 4px 45px rgba(0, 0, 0, 0.3)',
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
                top: OG_PADDING_Y + TICKET_PADDING_Y,
                left: OG_PADDING_X + TICKET_PADDING_X,
                width: '530',
                height: 'auto',
                overflow: 'hidden',
                textOverflow: 'clip',
                textAlign: 'left',
                marginBottom: '10px',
              }}
            >
              <p
                style={{
                  color: STYLING_CONGIF[ticketType].FOREGROUND,
                  margin: '0',
                  padding: '0',
                  fontSize: '36',
                  lineHeight: '105%',
                  display: 'flex',
                  marginBottom: '10px',
                }}
              >
                {name ?? username}
              </p>

              <div
                style={{
                  color: STYLING_CONGIF[ticketType].FOREGROUND_LIGHT,
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
            <div
              style={{
                position: 'absolute',
                bottom: OG_PADDING_Y + TICKET_PADDING_Y,
                left: OG_PADDING_X + TICKET_PADDING_X,
                display: 'flex',
                gap: '10',
                alignItems: 'flex-start',
                justifyContent: 'center',
                flexDirection: 'column',
                fontFamily: '"SourceCodePro"',
                fontSize: '23',
                textTransform: 'uppercase',
                letterSpacing: '0.35rem',
                lineHeight: '120%',
              }}
            >
              <div style={{ display: 'flex', marginBottom: '10', marginLeft: '-10' }}>
                <img src={BACKGROUND[ticketType].LOGO} width={65} height={65} />
              </div>
              {/* Ticket No  */}
              <p
                style={{
                  color: STYLING_CONGIF[ticketType].FOREGROUND_LIGHT,
                  margin: '0',
                  marginBottom: '5',
                  display: 'flex',
                }}
              >
                {`NO ${prefix}${ticketNumber}`}
              </p>
              <p
                style={{
                  margin: '0',
                  marginBottom: '5',
                  display: 'flex',
                }}
              >
                Launch Week X
              </p>
              <p
                style={{
                  margin: '0',
                }}
              >
                DEC 11-15 / 8AM PT
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
      .upload(`lwx/og/${ticketType}/${username}.png`, generatedTicketImage.body!, {
        contentType: 'image/png',
        // cacheControl: `${60 * 60 * 24 * 7}`,
        cacheControl: `0`,
        // Update cached og image, people might need to update info
        upsert: true,
      })

    if (storageError) throw new Error(`storageError: ${storageError.message}`)

    // Generate og image
    fetch('https://obuldanrptloktxcffvn.supabase.co/functions/v1/lwx-ticket-og', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idWxkYW5ycHRsb2t0eGNmZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTIyNjkzMjYsImV4cCI6MjAwNzg0NTMyNn0.1S6qpBbHtEmGuMsIx5UOhRiFd4YbVv-yLTrLk6tVGmM',
      },
      body: JSON.stringify({
        username,
        platinum,
      }),
    }).catch((err) => console.log('generate og err', err))

    const NEW_TIMESTAMP = new Date()

    return await fetch(`${STORAGE_URL}/og/${ticketType}/${username}.png?t=${NEW_TIMESTAMP}`)
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}
