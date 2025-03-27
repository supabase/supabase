import React from 'react'
import { ImageResponse } from '@vercel/og'
import { createClient } from '@supabase/supabase-js'
import { themes } from '~/components/LaunchWeek/14/utils/ticketThemes'

export const runtime = 'edge' // 'nodejs' is the default
export const dynamic = 'force-dynamic' // defaults to auto
export const fetchCache = 'force-no-store'
export const revalidate = 0

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/images/launch-week/lw14`

// Load custom font
const FONT_URL = `${STORAGE_URL}/assets/font/Nippo-Regular.otf`
const MONO_FONT_URL = `${STORAGE_URL}/assets/font/DepartureMono-Regular.otf`
const font = fetch(new URL(FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())
const mono_font = fetch(new URL(MONO_FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())

const LW_TABLE = 'tickets'
const LW_MATERIALIZED_VIEW = 'tickets_view'

export async function GET(req: Request, res: Response) {
  const url = new URL(req.url)
  const username = url.searchParams.get('username') ?? url.searchParams.get('amp;username')
  const assumePlatinum = url.searchParams.get('platinum') ?? url.searchParams.get('amp;platinum')
  const userAgent = req.headers.get('user-agent')

  try {
    if (!username) throw new Error('missing username param')

    const supabaseAdminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.LIVE_SUPABASE_COM_SERVICE_ROLE_KEY as string
    )

    // Track social shares
    if (userAgent?.toLocaleLowerCase().includes('twitter')) {
      await supabaseAdminClient
        .from(LW_TABLE)
        .update({ shared_on_twitter: 'now' })
        .eq('launch_week', 'lw14')
        .eq('username', username)
        .is('shared_on_twitter', null)
    } else if (userAgent?.toLocaleLowerCase().includes('linkedin')) {
      await supabaseAdminClient
        .from(LW_TABLE)
        .update({ shared_on_linkedin: 'now' })
        .eq('launch_week', 'lw14')
        .eq('username', username)
        .is('shared_on_linkedin', null)
    }

    // Get ticket data
    const { data: user, error } = await supabaseAdminClient
      .from(LW_MATERIALIZED_VIEW)
      .select(
        'id, name, metadata, shared_on_twitter, shared_on_linkedin, platinum, secret, role, company, location, ticket_number'
      )
      .eq('launch_week', 'lw14')
      .eq('username', username)
      .maybeSingle()

    if (error) console.log('Failed to fetch user. Inner error:', error.message)
    if (!user) throw new Error(error?.message ?? 'user not found')

    const {
      name,
      secret,
      platinum: isPlatinum,
      shared_on_twitter: sharedOnTwitter,
      shared_on_linkedin: sharedOnLinkedIn,
      ticket_number,
    } = user

    const platinum = isPlatinum ?? (!!sharedOnTwitter && !!sharedOnLinkedIn) ?? false
    if (assumePlatinum && !platinum) return await fetch(`${STORAGE_URL}/images/og-14-platinum.png`)

    const seatCode = (466561 + (ticket_number || 0)).toString(36).toUpperCase()

    // Generate image and upload to storage.
    const ticketType = secret ? 'secret' : platinum ? 'platinum' : 'regular'

    const STYLING_CONFIG = () => ({
      TICKET_FOREGROUND: themes()[ticketType].TICKET_FOREGROUND,
    })

    const TICKET_THEME = {
      regular: {
        color: 'rgb(239, 239, 239)',
        background: 'transparent',
      },
      secret: {
        color: 'rgba(44, 244, 148)',
        background: 'rgba(44, 244, 148, 0.2)',
      },
      platinum: {
        color: 'rgba(255, 199, 58)',
        background: 'rgba(255, 199, 58, 0.2)',
      },
    }

    const fontData = await font
    const monoFontData = await mono_font

    const OG_WIDTH = 1200
    const OG_HEIGHT = 628
    const USERNAME_BOTTOM = 435

    const BACKGROUND = () => ({
      regular: {
        LOGO: `${STORAGE_URL}/assets/supabase/supabase-logo-icon.png?v4`,
        BACKGROUND_IMG: `${STORAGE_URL}/assets/og-14-regular.png`,
      },
      platinum: {
        LOGO: `${STORAGE_URL}/assets/supabase/supabase-logo-icon.png?v4`,
        BACKGROUND_IMG: `${STORAGE_URL}/assets/og-14-platinum.png`,
      },
      secret: {
        LOGO: `${STORAGE_URL}/assets/supabase/supabase-logo-icon.png?v4`,
        BACKGROUND_IMG: `${STORAGE_URL}/assets/og-14-secret.png`,
      },
    })

    const usernameToLines = (username: string): string[] => {
      const lineLenght = 12

      const line1 = username.slice(0, lineLenght).trim().replace(/ /g, '\u00A0')
      const line2 = username
        .slice(lineLenght, lineLenght * 2)
        .trim()
        .replace(/ /g, '\u00A0')
      let line3 = username
        .slice(lineLenght * 2)
        .trim()
        .replace(/ /g, '\u00A0')

      // NOTE: If third line is too long, trim to 8 characters and add '...'
      if (line3.length > lineLenght) {
        line3 = line3.slice(0, 8) + '...'
      }

      // NOTE: Only include non-empty lines
      return [line1, line2, line3].filter((line) => line.length > 0)
    }

    const computeBackgroundWidth = (letters: number) => {
      return 100 + (letters * 40 + (letters - 1) * 12)
    }
    const lines = usernameToLines(name ?? username)

    const generatedTicketImage = new ImageResponse(
      (
        <>
          <div
            style={{
              width: '1200px',
              height: '628px',
              position: 'relative',
              fontFamily: '"Nippo-Regular"',
              overflow: 'hidden',
              color: STYLING_CONFIG().TICKET_FOREGROUND,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Background */}
            <img
              width="1204"
              height="634"
              style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                bottom: '-2px',
                right: '-2px',
                zIndex: '0',
                backgroundSize: 'cover',
                backgroundColor: STYLING_CONFIG().TICKET_FOREGROUND,
              }}
              src={BACKGROUND()[ticketType].BACKGROUND_IMG}
            />
            {/* Seat number */}
            <div
              style={{
                transform: 'rotate(-90deg)',
                fontFamily: '"Nippo-Regular"',
                fontSize: '82px',
                position: 'absolute',
                color: TICKET_THEME[ticketType].color,
                top: 70,
                right: 135,
              }}
            >
              {seatCode}
            </div>

            {/* Render each username line */}
            {lines.map((line, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  position: 'absolute',
                  bottom: USERNAME_BOTTOM - index * 80,
                  paddingLeft: '93px',
                  paddingRight: 0,
                  left: 27,
                  height: '61px',
                  width: `${computeBackgroundWidth(line.length)}px`,
                  backgroundColor: TICKET_THEME[ticketType].background,
                }}
              >
                <p
                  style={{
                    fontFamily: '"DepartureMono-Regular"',
                    margin: '0',
                    color: TICKET_THEME[ticketType].color,
                    padding: '0',
                    fontSize: '82px',
                    lineHeight: '56px',
                    display: 'flex',
                  }}
                >
                  {line}
                </p>
              </div>
            ))}
          </div>
        </>
      ),
      {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        fonts: [
          {
            name: 'Nippo-Regular',
            data: fontData,
            style: 'normal',
          },
          {
            name: 'DepartureMono-Regular',
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

    // [Note] Uncomment only for local testing to return the image directly and skip storage upload.
    // return await generatedTicketImage

    // Upload image to storage.
    const { error: storageError } = await supabaseAdminClient.storage
      .from('images')
      .upload(`launch-week/lw14/og/${ticketType}/${username}.png`, generatedTicketImage.body!, {
        contentType: 'image/png',
        // cacheControl: `${60 * 60 * 24 * 7}`,
        cacheControl: `0`,
        // Update cached og image, people might need to update info
        upsert: true,
      })

    if (storageError) throw new Error(`storageError: ${storageError.message}`)

    const NEW_TIMESTAMP = new Date()

    return await fetch(`${STORAGE_URL}/og/${ticketType}/${username}.png?t=${NEW_TIMESTAMP}`)
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}
