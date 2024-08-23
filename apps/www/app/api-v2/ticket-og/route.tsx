import React from 'react'
import { ImageResponse } from '@vercel/og'
import { createClient } from '@supabase/supabase-js'
import { themes } from '~/components/LaunchWeek/12/Ticket/ticketThemes'

export const runtime = 'edge' // 'nodejs' is the default
export const dynamic = 'force-dynamic' // defaults to auto
export const fetchCache = 'force-no-store'
export const revalidate = 0

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/images/launch-week/lw12`

// Load custom font
const FONT_URL = `${STORAGE_URL}/assets/font/CircularStd-Book.otf`
const MONO_FONT_URL = `${STORAGE_URL}/assets/font/SourceCodePro-Regular.ttf`
const font = fetch(new URL(FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())
const mono_font = fetch(new URL(MONO_FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())
// const BUCKET_FOLDER_VERSION = 'v1'

const LW_TABLE = 'tickets'
const LW_MATERIALIZED_VIEW = 'tickets_view'

export async function GET(req: Request, res: Response) {
  const url = new URL(req.url)
  console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
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
        .eq('launch_week', 'lw12')
        .eq('username', username)
        .is('shared_on_twitter', null)
    } else if (userAgent?.toLocaleLowerCase().includes('linkedin')) {
      await supabaseAdminClient
        .from(LW_TABLE)
        .update({ shared_on_linkedin: 'now' })
        .eq('launch_week', 'lw12')
        .eq('username', username)
        .is('shared_on_linkedin', null)
    }

    // Get ticket data
    const { data: user, error } = await supabaseAdminClient
      .from(LW_MATERIALIZED_VIEW)
      .select(
        'id, name, ticket_number, shared_on_twitter, shared_on_linkedin, platinum, secret, role, company, location'
      )
      .eq('launch_week', 'lw12')
      .eq('username', username)
      .maybeSingle()

    if (error) console.log('fetch error', error.message)
    if (!user) throw new Error(error?.message ?? 'user not found')

    const {
      name,
      ticket_number: ticketNumber,
      secret,
      platinum: isPlatinum,
      shared_on_twitter: sharedOnTwitter,
      shared_on_linkedin: sharedOnLinkedIn,
    } = user

    console.log(user)

    const platinum = isPlatinum ?? (!!sharedOnTwitter && !!sharedOnLinkedIn) ?? false
    if (assumePlatinum && !platinum)
      return await fetch(`${STORAGE_URL}/assets/platinum_no_meme.jpg`)

    // Generate image and upload to storage.
    const ticketType = secret ? 'secret' : platinum ? 'platinum' : 'regular'

    const STYLING_CONFIG = {
      BACKGROUND: themes[ticketType].OG_BACKGROUND,
      FOREGROUND: themes[ticketType].TICKET_FOREGROUND,
      FOREGROUND_LIGHT: themes[ticketType].TICKET_FOREGROUND_LIGHT,
      TICKET_BORDER: themes[ticketType].TICKET_BORDER,
      TICKET_FOREGROUND: themes[ticketType].TICKET_FOREGROUND,
      TICKET_BACKGROUND: themes[ticketType].TICKET_BACKGROUND,
      TICKET_BACKGROUND_CODE: themes[ticketType].TICKET_BACKGROUND_CODE,
      TICKET_FOREGROUND_LIGHT: themes[ticketType].TICKET_FOREGROUND_LIGHT,
      BORDER: themes[ticketType].TICKET_BORDER,
      CODE_LINE_NUMBER: themes[ticketType].CODE_LINE_NUMBER,
      CODE_BASE: themes[ticketType].CODE_THEME['hljs'].color,
      CODE_HIGHLIGHT: themes[ticketType].CODE_HIGHLIGHT_BACKGROUND,
      CODE_FUNCTION: themes[ticketType].CODE_THEME['hljs'].color,
      CODE_VARIABLE: themes[ticketType].CODE_THEME['hljs'].color,
      CODE_METHOD: themes[ticketType].CODE_THEME['hljs'].color,
      CODE_EXPRESSION: themes[ticketType].CODE_THEME['hljs-keyword'].color,
      CODE_STRING: themes[ticketType].CODE_THEME['hljs-string'].color,
      CODE_NUMBER: themes[ticketType].CODE_THEME['hljs'].color,
      CODE_NULL: themes[ticketType].CODE_THEME['hljs'].color,
      JSON_KEY: themes[ticketType].CODE_THEME['hljs-attr'].color,
    }

    const fontData = await font
    const monoFontData = await mono_font
    const OG_WIDTH = 1200
    const OG_HEIGHT = 628
    const OG_PADDING_X = 60
    const OG_PADDING_Y = 60
    const TICKET_WIDTH = 550
    const TICKET_RATIO = 396 / 613
    const TICKET_HEIGHT = TICKET_WIDTH / TICKET_RATIO
    const TICKET_POS_TOP = OG_PADDING_Y
    const TICKET_POS_LEFT = 540
    const LOGO_WIDTH = 40
    const LOGO_RATIO = 436 / 449
    const DISPLAY_NAME = name || username
    const FIRST_NAME = DISPLAY_NAME?.split(' ')[0]

    const BACKGROUND = {
      regular: {
        LOGO: `${STORAGE_URL}/assets/supabase/supabase-logo-icon.png`,
        BACKGROUND_GRID: `${STORAGE_URL}/assets/bg-dark.png?t=2024-07-26T11%3A13%3A36.534Z`,
      },
      platinum: {
        LOGO: `${STORAGE_URL}/assets/supabase/supabase-logo-icon.png`,
        BACKGROUND_GRID: `${STORAGE_URL}/assets/bg-dark.png?t=2024-07-26T11%3A13%3A36.534Z`,
      },
      secret: {
        LOGO: `${STORAGE_URL}/assets/supabase/supabase-logo-icon-white.png`,
        BACKGROUND_GRID: `${STORAGE_URL}/assets/bg-light.png`,
      },
    }

    const lineNumberStyle = {
      paddingLeft: 24,
      width: 46,
      color: STYLING_CONFIG.CODE_LINE_NUMBER,
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
              color: STYLING_CONFIG.FOREGROUND,
              backgroundColor: STYLING_CONFIG.BACKGROUND,
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
                opacity: ticketType === 'secret' ? 0.2 : 0.5,
                background: STYLING_CONFIG.BACKGROUND,
                backgroundSize: 'cover',
              }}
              src={BACKGROUND[ticketType].BACKGROUND_GRID}
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
                borderRadius: '20px',
                fontSize: 18,
                background: STYLING_CONFIG.TICKET_BACKGROUND_CODE,
                color: STYLING_CONFIG.TICKET_FOREGROUND,
                border: `1px solid ${STYLING_CONFIG.TICKET_BORDER}`,
                boxShadow: '0px 0px 45px rgba(0, 0, 0, 0.15)',
              }}
              tw="flex flex-col overflow-hidden"
            >
              <span
                tw="uppercase p-6"
                style={{
                  fontSize: 18,
                  letterSpacing: 2,
                  color: STYLING_CONFIG.FOREGROUND,
                }}
              >
                Launch Week 12
                <span tw="pl-2" style={{ color: STYLING_CONFIG.TICKET_FOREGROUND_LIGHT }}>
                  Ticket
                </span>
              </span>
              {/* Request code snippet */}
              <div
                style={{ fontFamily: '"SourceCodePro"', lineHeight: '130%' }}
                tw="p-6 pt-0 flex flex-row w-full"
              >
                <div tw="w-6 flex flex-col" style={{ color: STYLING_CONFIG.CODE_LINE_NUMBER }}>
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
                <div
                  tw="flex flex-col"
                  style={{
                    color: STYLING_CONFIG.CODE_BASE,
                  }}
                >
                  <span>
                    <span style={{ color: STYLING_CONFIG.CODE_EXPRESSION }}>await</span>{' '}
                    <span style={{ color: STYLING_CONFIG.CODE_FUNCTION }} tw="ml-3">
                      supabase
                    </span>
                  </span>
                  <span tw="pl-4">
                    <span>.</span>
                    <span style={{ color: STYLING_CONFIG.CODE_METHOD }}>from</span>
                    <span>&#40;</span>
                    <span style={{ color: STYLING_CONFIG.CODE_STRING }}>'tickets'</span>
                    <span>&#41;</span>
                  </span>
                  <span tw="pl-4">
                    <span>.</span>
                    <span style={{ color: STYLING_CONFIG.CODE_METHOD }}>select</span>
                    <span>&#40;</span>
                    <span style={{ color: STYLING_CONFIG.CODE_STRING }}>'*'</span>
                    <span>&#41;</span>
                  </span>
                  <span tw="pl-4">
                    <span>.</span>
                    <span style={{ color: STYLING_CONFIG.CODE_METHOD }}>eq</span>
                    <span>&#40;</span>
                    <span style={{ color: STYLING_CONFIG.CODE_STRING }}>'username'</span>
                    <span tw="mr-3">,</span>
                    <span style={{ color: STYLING_CONFIG.CODE_STRING }}>'{username}'</span>
                    <span>&#41;</span>
                  </span>
                  <span tw="pl-4">
                    <span>.</span>
                    <span style={{ color: STYLING_CONFIG.CODE_METHOD }}>single</span>
                    <span>&#40;</span>
                    <span>&#41;</span>
                  </span>
                </div>
              </div>
              {/* Response Json */}
              <div
                style={{
                  fontFamily: '"SourceCodePro"',
                  lineHeight: '130%',
                  background: STYLING_CONFIG.TICKET_BACKGROUND,
                  borderTop: `1px solid ${STYLING_CONFIG.TICKET_BORDER}`,
                }}
                tw="py-6 flex flex-col flex-grow w-full"
              >
                <div
                  tw="flex px-6 mb-4 uppercase"
                  style={{
                    lineHeight: '100%',
                    fontSize: 16,
                    color: STYLING_CONFIG.TICKET_FOREGROUND_LIGHT,
                  }}
                >
                  TICKET RESPONSE
                </div>
                <div
                  tw="flex flex-col w-full"
                  style={{
                    color: STYLING_CONFIG.CODE_BASE,
                  }}
                >
                  <div tw="flex">
                    <span style={lineNumberStyle}>1</span>
                    <span>&#123;</span>
                  </div>
                  <div tw="flex">
                    <span style={lineNumberStyle}>2</span>
                    <span>
                      <span tw="ml-6" style={{ color: STYLING_CONFIG.JSON_KEY }}>
                        "data"
                      </span>
                      <span tw="mr-2">:</span>
                      <span>&#123;</span>
                    </span>
                  </div>
                  <div
                    tw="flex flex-col w-full"
                    style={{
                      background: STYLING_CONFIG.CODE_HIGHLIGHT,
                      borderLeft: `1px solid ${STYLING_CONFIG.CODE_BASE}`,
                    }}
                  >
                    <div tw="flex">
                      <span style={lineNumberStyle}>3</span>
                      <span>
                        <span tw="ml-12 mr-2" style={{ color: STYLING_CONFIG.JSON_KEY }}>
                          "name"
                        </span>
                        <span>:</span>
                        <span tw="ml-2" style={{ color: STYLING_CONFIG.CODE_STRING }}>
                          "{name}"
                        </span>
                        <span>,</span>
                      </span>
                    </div>
                    <div tw="flex">
                      <span style={lineNumberStyle}>4</span>
                      <span>
                        <span tw="ml-12 mr-2" style={{ color: STYLING_CONFIG.JSON_KEY }}>
                          "username"
                        </span>
                        <span>:</span>
                        <span tw="ml-2" style={{ color: STYLING_CONFIG.CODE_STRING }}>
                          "{username}"
                        </span>
                        <span>,</span>
                      </span>
                    </div>
                    <div tw="flex">
                      <span style={lineNumberStyle}>6</span>
                      <span>
                        <span tw="ml-12 mr-2" style={{ color: STYLING_CONFIG.JSON_KEY }}>
                          "ticket_number"
                        </span>
                        <span>:</span>
                        <span tw="ml-2" style={{ color: STYLING_CONFIG.CODE_STRING }}>
                          "{ticketNumber}"
                        </span>
                        <span>,</span>
                      </span>
                    </div>
                    <div tw="flex">
                      <span style={lineNumberStyle}>7</span>
                      <span>
                        <span tw="ml-12 mr-2" style={{ color: STYLING_CONFIG.JSON_KEY }}>
                          "role"
                        </span>
                        <span>:</span>
                        {user.role ? (
                          <span tw="ml-2" style={{ color: STYLING_CONFIG.CODE_STRING }}>
                            "{user.role}"
                          </span>
                        ) : (
                          <span tw="ml-2" style={{ color: STYLING_CONFIG.CODE_NULL }}>
                            null
                          </span>
                        )}
                        <span>,</span>
                      </span>
                    </div>
                    <div tw="flex">
                      <span style={lineNumberStyle}>8</span>
                      <span>
                        <span tw="ml-12 mr-2" style={{ color: STYLING_CONFIG.JSON_KEY }}>
                          "company"
                        </span>
                        <span>:</span>
                        {user.company ? (
                          <span tw="ml-2" style={{ color: STYLING_CONFIG.CODE_STRING }}>
                            "{user.company}"
                          </span>
                        ) : (
                          <span tw="ml-2" style={{ color: STYLING_CONFIG.CODE_NULL }}>
                            null
                          </span>
                        )}
                        <span>,</span>
                      </span>
                    </div>
                    <div tw="flex">
                      <span style={lineNumberStyle}>9</span>
                      <span>
                        <span tw="ml-12 mr-2" style={{ color: STYLING_CONFIG.JSON_KEY }}>
                          "location"
                        </span>
                        <span>:</span>
                        {user.location ? (
                          <span tw="ml-2" style={{ color: STYLING_CONFIG.CODE_STRING }}>
                            "{user.location}"
                          </span>
                        ) : (
                          <span tw="ml-2" style={{ color: STYLING_CONFIG.CODE_NULL }}>
                            null
                          </span>
                        )}
                        <span>,</span>
                      </span>
                    </div>
                  </div>
                  <div tw="flex">
                    <span style={lineNumberStyle}>10</span>
                    <span tw="ml-6">&#125;,</span>
                  </div>
                  <div tw="flex">
                    <span style={lineNumberStyle}>11</span>
                    <span>
                      <span tw="ml-6" style={{ color: STYLING_CONFIG.JSON_KEY }}>
                        "error"
                      </span>
                      <span>:</span>
                      <span tw="ml-2" style={{ color: STYLING_CONFIG.CODE_NULL }}>
                        null
                      </span>
                    </span>
                  </div>
                  <div tw="flex">
                    <span style={lineNumberStyle}>12</span>
                    <span tw="ml-2">&#125;</span>
                  </div>
                </div>
              </div>
            </div>

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
                justifyContent: 'center',
                letterSpacing: '0.15rem',
                lineHeight: '110%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  position: 'absolute',
                  top: 10,
                  left: 0,
                  marginBottom: '40',
                }}
              >
                <img
                  src={BACKGROUND[ticketType].LOGO}
                  width={LOGO_WIDTH}
                  height={LOGO_WIDTH / LOGO_RATIO}
                  alt="logo"
                />
              </div>

              <p
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  marginBottom: 60,
                  fontSize: 38,
                  letterSpacing: '0',
                  color: STYLING_CONFIG.FOREGROUND_LIGHT,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    margin: 0,
                    color: STYLING_CONFIG.FOREGROUND_LIGHT,
                  }}
                >
                  Join {FIRST_NAME} for
                </span>
                <span
                  style={{
                    display: 'flex',
                    margin: 0,
                    color: STYLING_CONFIG.FOREGROUND,
                  }}
                >
                  Launch Week 12
                </span>
              </p>
              <p
                style={{
                  margin: '0',
                  fontFamily: '"SourceCodePro"',
                  fontSize: 26,
                  textTransform: 'uppercase',
                  color: STYLING_CONFIG.FOREGROUND_LIGHT,
                }}
              >
                August 12-16 / 7AM PT
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
      .upload(`launch-week/lw12/og/${ticketType}/${username}.png`, generatedTicketImage.body!, {
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
