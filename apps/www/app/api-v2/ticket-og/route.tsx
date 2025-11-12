import * as Sentry from '@sentry/nextjs'
import { createClient } from '@supabase/supabase-js'
import { ImageResponse } from '@vercel/og'
import useTicketBg from 'components/LaunchWeek/15/hooks/use-ticket-bg'

export const runtime = 'edge' // 'nodejs' is the default
export const dynamic = 'force-dynamic' // defaults to auto
export const fetchCache = 'force-no-store'
export const revalidate = 0

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/images/launch-week/lw15`
// Load custom fonts
const FONT_URLS = {
  SANS: 'https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/fonts/CircularStd-Book.otf',
}

const LW_TABLE = 'tickets'
const LW_MATERIALIZED_VIEW = 'tickets_view'

export async function GET(req: Request) {
  const url = new URL(req.url)

  // Just here to silence snyk false positives
  // Verify that req.url is from an allowed domain
  const username = url.searchParams.get('username') ?? url.searchParams.get('amp;username')
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
        .eq('launch_week', 'lw15')
        .eq('username', username)
        .is('shared_on_twitter', null)
    } else if (userAgent?.toLocaleLowerCase().includes('linkedin')) {
      await supabaseAdminClient
        .from(LW_TABLE)
        .update({ shared_on_linkedin: 'now' })
        .eq('launch_week', 'lw15')
        .eq('username', username)
        .is('shared_on_linkedin', null)
    }

    // Get ticket data
    const { data: user, error } = await supabaseAdminClient
      .from(LW_MATERIALIZED_VIEW)
      .select(
        'id, name, metadata, shared_on_twitter, shared_on_linkedin, role, company, location, ticket_number'
      )
      .eq('launch_week', 'lw15')
      .eq('username', username)
      .maybeSingle()

    if (error) console.log('Failed to fetch user. Inner error:', error.message)
    if (!user) throw new Error(error?.message ?? 'user not found')

    const FONT_SANS = fetch(new URL(FONT_URLS['SANS'], import.meta.url)).then((res) =>
      res.arrayBuffer()
    )
    const FONT_DATA = await FONT_SANS

    const { metadata, ticket_number } = user

    const ticketBg = useTicketBg(ticket_number)

    // Generate image and upload to storage.
    const ticketType = 'regular'

    const STYLING_CONFIG = {
      TICKET_FOREGROUND: metadata.colors?.foreground ?? '#ffffff',
      TICKET_BACKGROUND: metadata.colors?.background ?? '#000000',
      IMG: ticketBg,
    }

    const OG_WIDTH = 1200
    const OG_HEIGHT = 628
    const OG_PADDING_Y = 100
    const OG_PADDING_X = 60
    const TICKET_RATIO = 940 / 1500
    const TICKET_WIDTH = 480
    const TICKET_HEIGHT = TICKET_WIDTH / TICKET_RATIO
    const SUPABASE_LOGO_IMG = `${STORAGE_URL}/assets/supabase-white.png`
    const SUPABASE_LOGO_RATIO = 541 / 103
    const SUPABASE_LOGO_HEIGHT = 24
    const DATE_FONT_SIZE = 75
    const LW15_LOGO_HEIGHT = 70
    const LW15_LEFT = `${STORAGE_URL}/assets/LW15_LEFT.png`
    const LW15_LEFT_RATIO = 215 / 116
    const LW15_RIGHT = `${STORAGE_URL}/assets/LW15_RIGHT.png`
    const LW15_RIGHT_RATIO = 145 / 116
    const LW15_TEXT_LOGO_FONT_SIZE = 90
    const USERNAME_FONT_SIZE = 40
    const TICKET_BOTTOM_TEXT_FONT_SIZE = 20

    const generatedTicketImage = new ImageResponse(
      (
        <>
          <div
            style={{
              width: '1200px',
              height: '628px',
              position: 'relative',
              fontFamily: 'Circular',
              overflow: 'hidden',
              color: STYLING_CONFIG.TICKET_BACKGROUND,
              backgroundColor: '#000',
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
                position: 'relative',
                width: '1204px',
                height: '634px',
                top: '-2px',
                left: '-2px',
                bottom: '-2px',
                right: '-2px',
                backgroundSize: 'cover',
                opacity: 0.25,
              }}
              src={STYLING_CONFIG.IMG}
            />

            {/* LINEAR GRADIENT */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                left: '0px',
                top: '0px',
                bottom: '0px',
                right: '0px',
                background: 'linear-gradient(to top, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0))',
                zIndex: 1,
              }}
            />

            {/* LEFT */}
            <div
              style={{
                position: 'absolute',
                width: `${OG_WIDTH - OG_PADDING_X * 2 - TICKET_WIDTH}px`,
                height: '100%',
                top: '0px',
                left: '0px',
                padding: `${OG_PADDING_Y}px 0 ${OG_PADDING_Y}px ${OG_PADDING_X}px`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#fff',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '40px',
                  top: '0px',
                  left: '0px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <p
                  style={{
                    fontSize: `28px`,
                    lineHeight: '110%',
                    margin: '0',
                  }}
                >
                  Launch Week 15
                </p>
                {/* <img
                  src={LW15_LEFT}
                  width="100%"
                  height="100%"
                  style={{
                    position: 'relative',
                    width: `${LW15_LOGO_HEIGHT * LW15_LEFT_RATIO}px`,
                    height: `${LW15_LOGO_HEIGHT}`,
                    backgroundSize: 'contain',
                  }}
                />
                <img
                  src={LW15_RIGHT}
                  width="100%"
                  height="100%"
                  style={{
                    position: 'relative',
                    width: `${LW15_LOGO_HEIGHT * LW15_RIGHT_RATIO}px`,
                    height: `${LW15_LOGO_HEIGHT}`,
                    backgroundSize: 'contain',
                  }}
                /> */}
              </div>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '30px',
                }}
              >
                <p
                  style={{
                    fontSize: `${DATE_FONT_SIZE}px`,
                    lineHeight: '110%',
                    margin: '0',
                  }}
                >
                  July 14—18
                </p>
                <img
                  src={SUPABASE_LOGO_IMG}
                  width="100%"
                  height="40px"
                  style={{
                    position: 'relative',
                    backgroundSize: 'contain',
                    height: `${SUPABASE_LOGO_HEIGHT}px`,
                    width: `${SUPABASE_LOGO_RATIO * SUPABASE_LOGO_HEIGHT}px`,
                    marginBottom: '20px',
                  }}
                />
              </div>
            </div>

            {/* TICKET */}
            <div
              style={{
                position: 'absolute',
                width: `${TICKET_WIDTH}px`,
                height: `${TICKET_HEIGHT}px`,
                top: `${OG_PADDING_Y - 40}px`,
                right: `${OG_PADDING_X}px`,
                backgroundColor: STYLING_CONFIG.TICKET_BACKGROUND,
                color: STYLING_CONFIG.TICKET_FOREGROUND,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #ffffff40',
                overflow: 'hidden',
                boxShadow: '0 0 60px 0 rgba(0, 0, 0, 0.5)',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '50%',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backgroundSize: 'cover',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    right: 0,
                  }}
                >
                  <img
                    width="600"
                    height="600"
                    src={STYLING_CONFIG.IMG}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backgroundSize: 'cover',
                      left: 0,
                      mixBlendMode: 'screen',
                      opacity: 0.7,
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      position: 'absolute',
                      background: STYLING_CONFIG.TICKET_BACKGROUND,
                      width: '100%',
                      height: '100%',
                      right: 0,
                      bottom: 0,
                      top: 0,
                      left: 0,
                      mixBlendMode: 'color',
                      opacity: 0.2,
                    }}
                  />
                  <span
                    className="absolute top-5 mx-auto inset-x-0 h-[15px] w-[50px] rounded-lg shadow-inner"
                    style={{
                      position: 'absolute',
                      top: '30px',
                      margin: '0 auto',
                      width: '70px',
                      height: '20px',
                      backgroundColor: '#000',
                      border: '1px solid #ffffff40',
                      borderRadius: '10px',
                    }}
                  />
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      zIndex: 2,
                      padding: '0px 18px',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        margin: '0',
                        padding: '0',
                      }}
                    >
                      <p
                        style={{
                          fontSize: `${LW15_TEXT_LOGO_FONT_SIZE}px`,
                          padding: '0',
                          margin: '0',
                        }}
                      >
                        LW
                      </p>
                      <p
                        style={{
                          fontSize: `${LW15_TEXT_LOGO_FONT_SIZE}px`,
                          padding: '0',
                          margin: '0',
                        }}
                      >
                        15
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  padding: '10px 20px',
                  gap: '0px',
                }}
              >
                <p
                  style={{
                    display: 'flex',
                    position: 'relative',
                    width: '100%',
                    backgroundSize: 'cover',
                    fontSize: `${USERNAME_FONT_SIZE}px`,
                    lineHeight: '110%',
                  }}
                >
                  @{username}
                </p>
                <div
                  style={{
                    display: 'flex',
                    position: 'relative',
                    width: '100%',
                    marginTop: '10px',
                  }}
                >
                  <p
                    style={{
                      fontSize: `${TICKET_BOTTOM_TEXT_FONT_SIZE}px`,
                      lineHeight: '110%',
                      width: '35%',
                      padding: '0',
                      margin: '0',
                    }}
                  >
                    Company
                  </p>
                  <p
                    style={{
                      fontSize: `${TICKET_BOTTOM_TEXT_FONT_SIZE}px`,
                      lineHeight: '110%',
                      padding: '0',
                      margin: '0',
                    }}
                  >
                    {metadata.company ?? '—'}
                  </p>
                </div>
                {/* <div
                  style={{
                    display: 'flex',
                    position: 'relative',
                    width: '100%',
                    marginTop: '8px',
                  }}
                >
                  <p
                    style={{
                      fontSize: `${TICKET_BOTTOM_TEXT_FONT_SIZE}px`,
                      lineHeight: '110%',
                      width: '35%',
                      padding: '0',
                      margin: '0',
                    }}
                  >
                    Location
                  </p>
                  <p
                    style={{
                      fontSize: `${TICKET_BOTTOM_TEXT_FONT_SIZE}px`,
                      lineHeight: '110%',
                      padding: '0',
                      margin: '0',
                    }}
                  >
                    {metadata.location ?? '—'}
                  </p>
                </div> */}
              </div>
            </div>
          </div>
        </>
      ),
      {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        fonts: [
          {
            name: 'CircularStd-Book',
            data: FONT_DATA,
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
    // return generatedTicketImage

    // Upload image to storage.
    const { error: storageError } = await supabaseAdminClient.storage
      .from('images')
      .upload(`launch-week/lw15/og/${ticketType}/${username}.png`, generatedTicketImage.body!, {
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
    Sentry.captureException(error)
    await Sentry.flush(2000)

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}
