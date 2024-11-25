import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { encodeUrl } from 'https://deno.land/x/encodeurl/mod.ts'
import { formatDateTime, normalizeString } from '../common/helpers.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL =
  Deno.env.get('SUPABASE_URL') !== 'http://kong:8000'
    ? Deno.env.get('SUPABASE_URL')
    : 'http://host.docker.internal:54321'

const STORAGE_BASE_PATH = `launch-week/lw13`
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/images/${STORAGE_BASE_PATH}`

// Load custom font
const FONT_URL = `${STORAGE_URL}/assets/font/CircularStd-Book.otf`
const MONO_FONT_URL = `${STORAGE_URL}/assets/font/SourceCodePro-Regular.ttf`
const font = fetch(new URL(FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())
const mono_font = fetch(new URL(MONO_FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())

const MEETUPS_TABLE = 'meetups'

const STYLING_CONGIF = {
  regular: {
    BACKGROUND: '#060809',
    FOREGROUND: '#F8F9FA',
    FOREGROUND_LIGHT: '#8B9092',
  },
}

export async function handler(req: Request) {
  const url = new URL(req.url)
  const meetupId = url.searchParams.get('id') ?? url.searchParams.get('amp;id')

  try {
    const supabaseAdminClient = createClient(
      // Supabase API URL - env var exported by default when deployed.
      Deno.env.get('LIVE_SUPABASE_URL') ?? 'http://host.docker.internal:54321',
      // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get ticket data
    const { data: meetup, error } = await supabaseAdminClient
      .from(MEETUPS_TABLE)
      .select('id, city, country, start_at, timezone')
      .eq('launch_week', 'lw13')
      .eq('id', meetupId)
      .maybeSingle()

    if (error) console.log('fetch error', error.message)
    if (!meetup) throw new Error(`No meetup found with id: ${meetupId}`)

    const ticketType = 'regular'
    const fontData = await font
    const monoFontData = await mono_font
    const OG_WIDTH = 1200
    const OG_HEIGHT = 800
    const OG_PADDING_X = 90
    const OG_PADDING_Y = 90

    const startAt = meetup.start_at ? formatDateTime(meetup.start_at, meetup.timezone) : ''

    const BACKGROUND = {
      regular: {
        BACKGROUND_IMG: `${STORAGE_URL}/assets/lw13-meetup-og-template.png`,
      },
    }

    const generatedOgImage = new ImageResponse(
      (
        <>
          <div
            style={{
              width: `${OG_WIDTH}px`,
              height: `${OG_HEIGHT}px`,
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
              width={`${OG_WIDTH + 4}px`}
              height={`${OG_HEIGHT + 4}px`}
              style={{
                position: 'absolute',
                top: '-1px',
                left: '-1px',
                bottom: '-1px',
                right: '-1px',
                zIndex: '0',
                background: STYLING_CONGIF[ticketType].BACKGROUND,
                backgroundSize: 'cover',
              }}
              src={BACKGROUND[ticketType].BACKGROUND_IMG}
            />

            <div
              style={{
                position: 'absolute',
                // top: OG_PADDING_Y,
                left: OG_PADDING_X,
                // bottom: OG_PADDING_Y,
                bottom: OG_PADDING_Y + 170,
                display: 'flex',
                flexDirection: 'column',
                width: OG_WIDTH - OG_PADDING_X * 2,
                alignItems: 'flex-start',
                justifyContent: 'center',
                letterSpacing: '0',
                lineHeight: '110%',
              }}
            >
              <p
                style={{
                  margin: '0',
                  fontFamily: '"SourceCodePro"',
                  fontSize: 32,
                  color: STYLING_CONGIF[ticketType].FOREGROUND_LIGHT,
                }}
              >
                {startAt}{' '}
              </p>
              <p
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  marginBottom: 20,
                  fontSize: 104,
                  letterSpacing: '-0.1rem',
                  color: STYLING_CONGIF[ticketType].FOREGROUND_LIGHT,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    margin: 0,
                    fontSize: 120,
                    color: STYLING_CONGIF[ticketType].FOREGROUND,
                  }}
                >
                  {meetup.city}
                </span>
                <span
                  style={{
                    display: 'flex',
                    margin: 0,
                    color: STYLING_CONGIF[ticketType].FOREGROUND,
                  }}
                >
                  Meetup
                </span>
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

    const normalizedCountry = normalizeString(meetup.country)
    const normalizedCity = normalizeString(meetup.city)

    const relativeFilePath = encodeUrl(
      `og/meetups/${normalizedCountry}-${normalizedCity}-${meetup.id}.png`
    )

    // Upload image to storage.
    const { error: storageError } = await supabaseAdminClient.storage
      .from('images')
      .upload(`${STORAGE_BASE_PATH}/${relativeFilePath}`, generatedOgImage.body!, {
        contentType: 'image/png',
        cacheControl: `0`,
        upsert: true,
      })

    if (storageError) throw new Error(`storageError: ${storageError.message}`)

    return await fetch(`${STORAGE_URL}/${relativeFilePath}`)
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}
