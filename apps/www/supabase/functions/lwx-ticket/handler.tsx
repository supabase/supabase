import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lwx'

// Load custom font
const FONT_URL = `${STORAGE_URL}/font/CircularStd-Book.otf`
const MONO_FONT_URL = `${STORAGE_URL}/font/SourceCodePro-Regular.ttf?t=2023-07-18T13%3A03%3A29.474Z`
const font = fetch(new URL(FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())
const mono_font = fetch(new URL(MONO_FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())
const BUCKET_FOLDER_VERSION = 'v1'

const LW_TABLE = 'lwx_tickets_golden'

const STYLING_CONGIF = {
  REG: {
    BACKGROUND: '#303030',
    FOREGROUND: '#F8F9FA',
    FOREGROUND_LIGHT: '#707070',
  },
  GOLD: {
    BACKGROUND: '#f1f1f1',
    FOREGROUND: '#11181C',
    FOREGROUND_LIGHT: '#7E868C',
  },
}

export async function handler(req: Request) {
  const url = new URL(req.url)
  const username = url.searchParams.get('username') ?? url.searchParams.get('amp;username')
  const assumeGolden = url.searchParams.get('golden') ?? url.searchParams.get('amp;golden')
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
      .from(LW_TABLE)
      .select('name, ticketNumber, sharedOnTwitter, sharedOnLinkedIn, metadata')
      .eq('username', username)
      .maybeSingle()

    if (error) console.log('fetch error', error.message)
    if (!data) throw new Error(error?.message ?? 'user not found')
    const { name, ticketNumber, metadata } = data

    const golden = (!!data?.sharedOnTwitter && !!data?.sharedOnLinkedIn) ?? false
    if (assumeGolden && !golden) return await fetch(`${STORAGE_URL}/assets/golden_no_meme.png`)

    // Else, generate image and upload to storage.
    const BACKGROUND = {
      REG: {
        BG: `${STORAGE_URL}/assets/lwx_ticket_bg.png`,
        LOGO: `${STORAGE_URL}/assets/logos/supabase_lwx_logo_dark.png?t=2023-11-23T09%3A37%3A36.974Z`,
      },
      GOLD: {
        BG: `${STORAGE_URL}/assets/lwx_ticket_bg_golden.png?t=2023-11-23T10%3A34%3A26.211Z`,
        LOGO: `${STORAGE_URL}/assets/logos/supabase_lwx_logo_light.png?t=2023-11-23T10%3A37%3A36.974Z`,
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

    const generatedTicketImage = new ImageResponse(
      (
        <>
          <div
            style={{
              width: '1200px',
              height: '628px',
              position: 'relative',
              backgroundColor: STYLING_CONGIF[golden ? 'GOLD' : 'REG'].BACKGROUND,
              color: STYLING_CONGIF[golden ? 'GOLD' : 'REG'].FOREGROUND,
              fontFamily: '"Circular"',
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
              src={golden ? BACKGROUND['GOLD']['BG'] : BACKGROUND['REG']['BG']}
            />

            {/* Name & username */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                flexDirection: 'column',
                position: 'absolute',
                top: '53',
                left: '73',
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
                  color: STYLING_CONGIF[golden ? 'GOLD' : 'REG'].FOREGROUND,
                  margin: '0',
                  padding: '0',
                  fontSize: '52',
                  lineHeight: '105%',
                  display: 'flex',
                  marginBottom: '10px',
                }}
              >
                {name ?? username}
              </p>

              {/* Username */}
              <div
                style={{
                  color: STYLING_CONGIF[golden ? 'GOLD' : 'REG'].FOREGROUND_LIGHT,
                  opacity: 0.8,
                  display: 'flex',
                  fontSize: '38',
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
                bottom: '60',
                left: '73',
                display: 'flex',
                gap: '10',
                alignItems: 'flex-start',
                justifyContent: 'center',
                flexDirection: 'column',
                fontFamily: '"SourceCodePro"',
                fontSize: '30',
                textTransform: 'uppercase',
                letterSpacing: '0.35rem',
                lineHeight: '120%',
              }}
            >
              <div style={{ display: 'flex', marginBottom: '20' }}>
                <img
                  src={golden ? BACKGROUND['GOLD']['LOGO'] : BACKGROUND['REG']['LOGO']}
                  width={60}
                  height={60}
                />
              </div>
              {/* Ticket No  */}
              <p
                style={{
                  color: STYLING_CONGIF[golden ? 'GOLD' : 'REG'].FOREGROUND_LIGHT,
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
                DEC 11-15 / 10AM PT
              </p>
            </div>
          </div>
        </>
      ),
      {
        width: 1200,
        height: 628,
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
      .upload(
        `lwx/tickets/${golden ? 'golden' : 'regular'}/${BUCKET_FOLDER_VERSION}/${username}.png`,
        generatedTicketImage.body!,
        {
          contentType: 'image/png',
          // cacheControl: `${60 * 60 * 24 * 7}`,
          cacheControl: `0`,
          // Update cached og image, people might need to update info
          upsert: true,
        }
      )
    if (storageError) throw new Error(`storageError: ${storageError.message}`)

    // Generate og image
    // fetch('https://obuldanrptloktxcffvn.supabase.co/functions/v1/lwx-ticket-og', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization:
    //       'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idWxkYW5ycHRsb2t0eGNmZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTIyNjkzMjYsImV4cCI6MjAwNzg0NTMyNn0.1S6qpBbHtEmGuMsIx5UOhRiFd4YbVv-yLTrLk6tVGmM',
    //   },
    //   body: JSON.stringify({
    //     username,
    //     golden,
    //   }),
    // })

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
