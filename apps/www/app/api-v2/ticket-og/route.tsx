import React from 'react'
import { ImageResponse } from '@vercel/og'
import { createClient } from '@supabase/supabase-js'
import { themes } from '~/components/LaunchWeek/13/Ticket/ticketThemes'

export const runtime = 'edge' // 'nodejs' is the default
export const dynamic = 'force-dynamic' // defaults to auto
export const fetchCache = 'force-no-store'
export const revalidate = 0

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/images/launch-week/lw13`

// Load custom font
const FONT_URL = `${STORAGE_URL}/assets/font/CircularStd-Book.otf`
const MONO_FONT_URL = `${STORAGE_URL}/assets/font/SourceCodePro-Regular.ttf`
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
        .eq('launch_week', 'lw13')
        .eq('username', username)
        .is('shared_on_twitter', null)
    } else if (userAgent?.toLocaleLowerCase().includes('linkedin')) {
      await supabaseAdminClient
        .from(LW_TABLE)
        .update({ shared_on_linkedin: 'now' })
        .eq('launch_week', 'lw13')
        .eq('username', username)
        .is('shared_on_linkedin', null)
    }

    // Get ticket data
    const { data: user, error } = await supabaseAdminClient
      .from(LW_MATERIALIZED_VIEW)
      .select(
        'id, name, metadata, shared_on_twitter, shared_on_linkedin, platinum, secret, role, company, location'
      )
      .eq('launch_week', 'lw13')
      .eq('username', username)
      .maybeSingle()

    if (error) console.log('fetch error', error.message)
    if (!user) throw new Error(error?.message ?? 'user not found')

    const {
      name,
      secret,
      platinum: isPlatinum,
      metadata,
      shared_on_twitter: sharedOnTwitter,
      shared_on_linkedin: sharedOnLinkedIn,
    } = user

    const isDark = metadata.theme !== 'light'

    const platinum = isPlatinum ?? (!!sharedOnTwitter && !!sharedOnLinkedIn) ?? false
    if (assumePlatinum && !platinum)
      return await fetch(`${STORAGE_URL}/assets/platinum_no_meme.jpg`)

    // Generate image and upload to storage.
    const ticketType = secret ? 'secret' : platinum ? 'platinum' : 'regular'

    const STYLING_CONFIG = (isDark?: boolean) => ({
      TICKET_FOREGROUND: themes(isDark)[ticketType].TICKET_FOREGROUND,
    })

    const fontData = await font
    const monoFontData = await mono_font
    const OG_WIDTH = 1200
    const OG_HEIGHT = 628
    const USERNAME_LEFT = 400
    const USERNAME_BOTTOM = 100
    const USERNAME_WIDTH = 400
    const DISPLAY_NAME = name || username

    const BACKGROUND = (isDark?: boolean) => ({
      regular: {
        LOGO: `${STORAGE_URL}/assets/supabase/supabase-logo-icon.png?v4`,
        BACKGROUND_IMG: `${STORAGE_URL}/assets/ticket-og-bg-regular-${isDark ? 'dark' : 'light'}.png?v4`,
      },
      platinum: {
        LOGO: `${STORAGE_URL}/assets/supabase/supabase-logo-icon.png?v4`,
        BACKGROUND_IMG: `${STORAGE_URL}/assets/ticket-og-bg-platinum.png?v4`,
      },
      secret: {
        LOGO: `${STORAGE_URL}/assets/supabase/supabase-logo-icon.png?v4`,
        BACKGROUND_IMG: `${STORAGE_URL}/assets/ticket-og-bg-secret.png?v4`,
      },
    })

    const generatedTicketImage = new ImageResponse(
      (
        <>
          <div
            style={{
              width: '1200px',
              height: '628px',
              position: 'relative',
              fontFamily: '"Circular"',
              overflow: 'hidden',
              color: STYLING_CONFIG(isDark).TICKET_FOREGROUND,
              display: 'flex',
              flexDirection: 'column',
              padding: '60px',
              justifyContent: 'space-between',
            }}
          >
            {/* Background  */}
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
              }}
              src={BACKGROUND(isDark)[ticketType].BACKGROUND_IMG}
            />

            {/* Name & username */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                flexDirection: 'column',
                position: 'absolute',
                bottom: USERNAME_BOTTOM,
                left: USERNAME_LEFT,
                width: USERNAME_WIDTH,
                height: 'auto',
                overflow: 'hidden',
                textOverflow: 'clip',
                textAlign: 'left',
                letterSpacing: '-0.5px',
                marginBottom: '10px',
              }}
            >
              <p
                style={{
                  margin: '0',
                  padding: '0',
                  fontSize: '54',
                  lineHeight: '105%',
                  display: 'flex',
                  marginBottom: '10px',
                }}
              >
                {DISPLAY_NAME}
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

    // [Note] Uncomment only for local testing to return the image directly and skip storage upload.
    // return await generatedTicketImage

    // Upload image to storage.
    const { error: storageError } = await supabaseAdminClient.storage
      .from('images')
      .upload(`launch-week/lw13/og/${ticketType}/${username}.png`, generatedTicketImage.body!, {
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
