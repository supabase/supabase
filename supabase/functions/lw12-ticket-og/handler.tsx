import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STORAGE_URL =
  'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/launch-week/lw12'
const FONTS_STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/fonts'

// Load custom font
const FONT_URL = `${FONTS_STORAGE_URL}/CircularStd-Book.otf`
const MONO_FONT_URL = `${FONTS_STORAGE_URL}/SourceCodePro-Regular.ttf`
const font = fetch(new URL(FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())
const mono_font = fetch(new URL(MONO_FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())
// const BUCKET_FOLDER_VERSION = 'v1'

const LW_TABLE = 'lw12_tickets'
const LW_MATERIALIZED_VIEW = 'lw12_tickets_view'

const STYLING_CONGIF = {
  regular: {
    BACKGROUND: '#060809',
    FOREGROUND: '#F8F9FA',
    FOREGROUND_LIGHT: '#8B9092',
    TICKET_BORDER: '#292929',
    TICKET_FOREGROUND: '#11181C',
    TICKET_BACKGROUND: '#1F1F1F',
    TICKET_BACKGROUND_CODE: '#141414',
    TICKET_FOREGROUND_LIGHT: '#888888',
    BORDER: '#adadad',
    CODE_LINE_NUMBER: '#4D4D4D',
    CODE_BASE: '#ddd',
    CODE_HIGHLIGHT: '#292929',
    CODE_FUNCTION: '#ddd',
    CODE_VARIABLE: '#ddd',
    CODE_METHOD: '#ddd',
    CODE_EXPRESSION: '#FFF',
    CODE_STRING: '#3ECF8E',
    CODE_NUMBER: '#3ECF8E',
    CODE_NULL: '#569cd6',
  },
  platinum: {
    BACKGROUND: '#060809',
    FOREGROUND: '#F8F9FA',
    FOREGROUND_LIGHT: '#8B9092',
    TICKET_BORDER: '#292929',
    TICKET_FOREGROUND: '#11181C',
    TICKET_BACKGROUND: '#1F1F1F',
    TICKET_BACKGROUND_CODE: '#141414',
    TICKET_FOREGROUND_LIGHT: '#888888',
    BORDER: '#adadad',
    CODE_LINE_NUMBER: '#4D4D4D',
    CODE_BASE: '#ddd',
    CODE_HIGHLIGHT: '#292929',
    CODE_FUNCTION: '#ddd',
    CODE_VARIABLE: '#ddd',
    CODE_METHOD: '#ddd',
    CODE_EXPRESSION: '#FFF',
    CODE_STRING: '#3ECF8E',
    CODE_NUMBER: '#3ECF8E',
    CODE_NULL: '#569cd6',
  },
  secret: {
    BACKGROUND: '#060809',
    FOREGROUND: '#F8F9FA',
    FOREGROUND_LIGHT: '#8B9092',
    TICKET_BORDER: '#292929',
    TICKET_FOREGROUND: '#11181C',
    TICKET_BACKGROUND: '#1F1F1F',
    TICKET_BACKGROUND_CODE: '#141414',
    TICKET_FOREGROUND_LIGHT: '#888888',
    BORDER: '#adadad',
    CODE_LINE_NUMBER: '#4D4D4D',
    CODE_BASE: '#ddd',
    CODE_HIGHLIGHT: '#292929',
    CODE_FUNCTION: '#ddd',
    CODE_VARIABLE: '#ddd',
    CODE_METHOD: '#ddd',
    CODE_EXPRESSION: '#FFF',
    CODE_STRING: '#3ECF8E',
    CODE_NUMBER: '#3ECF8E',
    CODE_NULL: '#569cd6',
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
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Track social shares
    if (userAgent?.toLocaleLowerCase().includes('twitter')) {
      await supabaseAdminClient
        .from(LW_TABLE)
        .update({ shared_on_twitter: 'now' })
        .eq('username', username)
        .is('shared_on_twitter', null)
    } else if (userAgent?.toLocaleLowerCase().includes('linkedin')) {
      await supabaseAdminClient
        .from(LW_TABLE)
        .update({ shared_on_linkedin: 'now' })
        .eq('username', username)
        .is('shared_on_linkedin', null)
    }

    // Get ticket data
    const { data: user, error } = await supabaseAdminClient
      .from(LW_MATERIALIZED_VIEW)
      .select(
        'id, name, ticket_number, shared_on_twitter, shared_on_linkedin, metadata, secret, role, company, location'
      )
      .eq('username', username)
      .maybeSingle()

    if (error) console.log('fetch error', error.message)
    if (!user) throw new Error(error?.message ?? 'user not found')

    const {
      name,
      ticket_number: ticketNumber,
      metadata,
      secret,
      shared_on_twitter: sharedOnTwitter,
      shared_on_linkedin: sharedOnLinkedIn,
    } = user

    const platinum = (!!sharedOnTwitter && !!sharedOnLinkedIn) ?? false
    if (assumePlatinum && !platinum)
      return await fetch(`${STORAGE_URL}/assets/platinum_no_meme.jpg`)

    // Generate image and upload to storage.
    const ticketType = secret ? 'secret' : platinum ? 'platinum' : 'regular'

    const fontData = await font
    const monoFontData = await mono_font
    const numDigits = `${Number(ticketNumber)}`.length
    const prefix = `0000000`.slice(numDigits)
    const HAS_ROLE = !!metadata?.role
    const HAS_COMPANY = !!metadata?.company
    const HAS_LOCATION = !!metadata?.location
    const HAS_AVATAR = !metadata?.hideAvatar
    const HAS_NO_META = !HAS_ROLE && !HAS_COMPANY && !HAS_LOCATION
    const OG_WIDTH = 1200
    const OG_HEIGHT = 628
    const OG_PADDING_X = 60
    const OG_PADDING_Y = 60
    const TICKET_WIDTH = 550
    const TICKET_RATIO = 396 / 613
    const TICKET_HEIGHT = TICKET_WIDTH / TICKET_RATIO
    const TICKET_POS_TOP = OG_PADDING_Y
    const TICKET_POS_LEFT = 540
    const TICKET_PADDING_X = 40
    const TICKET_PADDING_Y = 40
    const LOGO_WIDTH = 40
    const LOGO_RATIO = 436 / 449
    const DISPLAY_NAME = name || username
    const FIRST_NAME = DISPLAY_NAME?.split(' ')[0]

    const BACKGROUND = {
      regular: {
        LOGO: `${STORAGE_URL}/assets/supabase/supabase-logo-icon.png`,
      },
      platinum: {
        LOGO: `${STORAGE_URL}/assets/supabase/supabase-logo-icon.png`,
      },
      secret: {
        LOGO: `${STORAGE_URL}/assets/supabase/supabase-logo-icon.png`,
      },
    }

    const lineNumberStyle = {
      width: 24,
      color: STYLING_CONGIF[ticketType].CODE_LINE_NUMBER,
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
                background: STYLING_CONGIF[ticketType].TICKET_BACKGROUND_CODE,
                border: `1px solid ${STYLING_CONGIF[ticketType].TICKET_BORDER}`,
              }}
              tw="flex flex-col overflow-hidden"
            >
              <span tw="uppercase p-6" style={{ fontSize: 18, letterSpacing: 2 }}>
                Launch Week 12
                <span
                  tw="pl-2"
                  style={{ color: STYLING_CONGIF[ticketType].TICKET_FOREGROUND_LIGHT }}
                >
                  Ticket
                </span>
              </span>
              {/* Request code snippet */}
              <div
                style={{ fontFamily: '"SourceCodePro"', lineHeight: '130%' }}
                tw="p-6 pt-0 flex flex-row w-full"
              >
                <div
                  tw="w-6 flex flex-col"
                  style={{ color: STYLING_CONGIF[ticketType].CODE_LINE_NUMBER }}
                >
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
                <div
                  tw="flex flex-col"
                  style={{
                    color: STYLING_CONGIF[ticketType].CODE_BASE,
                  }}
                >
                  <span>
                    <span style={{ color: STYLING_CONGIF[ticketType].CODE_EXPRESSION }}>await</span>{' '}
                    <span style={{ color: STYLING_CONGIF[ticketType].CODE_FUNCTION }} tw="ml-3">
                      supabase
                    </span>
                  </span>
                  <span tw="pl-4">
                    <span>.</span>
                    <span style={{ color: STYLING_CONGIF[ticketType].CODE_METHOD }}>from</span>
                    <span>&#40;</span>
                    <span style={{ color: STYLING_CONGIF[ticketType].CODE_STRING }}>
                      'lw12_tickets_view'
                    </span>
                    <span>&#41;</span>
                  </span>
                  <span tw="pl-4">
                    <span>.</span>
                    <span style={{ color: STYLING_CONGIF[ticketType].CODE_METHOD }}>select</span>
                    <span>&#40;</span>
                    <span style={{ color: STYLING_CONGIF[ticketType].CODE_STRING }}>'*'</span>
                    <span>&#41;</span>
                  </span>
                  <span tw="pl-4">
                    <span>.</span>
                    <span style={{ color: STYLING_CONGIF[ticketType].CODE_METHOD }}>eq</span>
                    <span>&#40;</span>
                    <span style={{ color: STYLING_CONGIF[ticketType].CODE_STRING }}>
                      'username'
                    </span>
                    <span tw="mr-3">,</span>
                    <span style={{ color: STYLING_CONGIF[ticketType].CODE_NUMBER }}>
                      {username}
                    </span>
                    <span>&#41;</span>
                  </span>
                  <span tw="pl-4">
                    <span>.</span>
                    <span style={{ color: STYLING_CONGIF[ticketType].CODE_METHOD }}>single</span>
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
                  background: STYLING_CONGIF[ticketType].TICKET_BACKGROUND,
                  borderTop: `1px solid ${STYLING_CONGIF[ticketType].TICKET_BORDER}`,
                }}
                tw="p-6 flex flex-col flex-grow w-full"
              >
                <div
                  tw="flex mb-4 uppercase"
                  style={{
                    lineHeight: '100%',
                    fontSize: 14,
                    color: STYLING_CONGIF[ticketType].TICKET_FOREGROUND_LIGHT,
                  }}
                >
                  TICKET RESPONSE
                </div>
                <div
                  tw="flex flex-col w-full"
                  style={{
                    color: STYLING_CONGIF[ticketType].CODE_BASE,
                  }}
                >
                  <div tw="flex">
                    <span style={lineNumberStyle}>1</span>
                    <span>&#123;</span>
                  </div>
                  <div tw="flex">
                    <span style={lineNumberStyle}>2</span>
                    <span>
                      <span tw="ml-6 mr-2" style={{ color: STYLING_CONGIF[ticketType].CODE_BASE }}>
                        "data":
                      </span>
                      <span>&#123;</span>
                    </span>
                  </div>
                  <div
                    tw="flex flex-col w-full"
                    style={{ background: STYLING_CONGIF[ticketType].CODE_HIGHLIGHT }}
                  >
                    <div tw="flex">
                      <span style={lineNumberStyle}>3</span>
                      <span>
                        <span
                          tw="ml-12 mr-2"
                          style={{ color: STYLING_CONGIF[ticketType].CODE_BASE }}
                        >
                          "name"
                        </span>
                        <span>:</span>
                        <span tw="ml-2" style={{ color: STYLING_CONGIF[ticketType].CODE_STRING }}>
                          "{name}"
                        </span>
                        <span>,</span>
                      </span>
                    </div>
                    <div tw="flex">
                      <span style={lineNumberStyle}>4</span>
                      <span>
                        <span
                          tw="ml-12 mr-2"
                          style={{ color: STYLING_CONGIF[ticketType].CODE_BASE }}
                        >
                          "username"
                        </span>
                        <span>:</span>
                        <span tw="ml-2" style={{ color: STYLING_CONGIF[ticketType].CODE_STRING }}>
                          "{username}"
                        </span>
                        <span>,</span>
                      </span>
                    </div>
                    <div tw="flex">
                      <span style={lineNumberStyle}>6</span>
                      <span>
                        <span
                          tw="ml-12 mr-2"
                          style={{ color: STYLING_CONGIF[ticketType].CODE_BASE }}
                        >
                          "ticketNumber"
                        </span>
                        <span>:</span>
                        <span tw="ml-2" style={{ color: STYLING_CONGIF[ticketType].CODE_STRING }}>
                          "{ticketNumber}"
                        </span>
                        <span>,</span>
                      </span>
                    </div>
                    <div tw="flex">
                      <span style={lineNumberStyle}>7</span>
                      <span>
                        <span
                          tw="ml-12 mr-2"
                          style={{ color: STYLING_CONGIF[ticketType].CODE_BASE }}
                        >
                          "role"
                        </span>
                        <span>:</span>
                        <span tw="ml-2" style={{ color: STYLING_CONGIF[ticketType].CODE_STRING }}>
                          "{user.role}"
                        </span>
                        <span>,</span>
                      </span>
                    </div>
                    <div tw="flex">
                      <span style={lineNumberStyle}>8</span>
                      <span>
                        <span
                          tw="ml-12 mr-2"
                          style={{ color: STYLING_CONGIF[ticketType].CODE_BASE }}
                        >
                          "company"
                        </span>
                        <span>:</span>
                        <span tw="ml-2" style={{ color: STYLING_CONGIF[ticketType].CODE_STRING }}>
                          "{user.company}"
                        </span>
                        <span>,</span>
                      </span>
                    </div>
                    <div tw="flex">
                      <span style={lineNumberStyle}>9</span>
                      <span>
                        <span
                          tw="ml-12 mr-2"
                          style={{ color: STYLING_CONGIF[ticketType].CODE_BASE }}
                        >
                          "location"
                        </span>
                        <span>:</span>
                        <span tw="ml-2" style={{ color: STYLING_CONGIF[ticketType].CODE_STRING }}>
                          "{user.location}"
                        </span>
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
                      <span tw="ml-6" style={{ color: STYLING_CONGIF[ticketType].CODE_BASE }}>
                        "error"
                      </span>
                      <span>:</span>
                      <span tw="ml-2" style={{ color: STYLING_CONGIF[ticketType].CODE_NULL }}>
                        null
                      </span>
                    </span>
                  </div>
                  <div tw="flex">
                    <span style={lineNumberStyle}>12</span>
                    <span tw="ml-2">&#125;</span>
                  </div>
                  {/* <div
                    tw="flex mt-8"
                    style={{ color: STYLING_CONGIF[ticketType].TICKET_FOREGROUND_LIGHT }}
                  >
                    71ms RESPONSE TIME
                  </div> */}
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
                />
              </div>

              <p
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  marginBottom: 60,
                  fontSize: 38,
                  letterSpacing: '0',
                  color: STYLING_CONGIF[ticketType].FOREGROUND_LIGHT,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    margin: 0,
                    color: STYLING_CONGIF[ticketType].FOREGROUND_LIGHT,
                  }}
                >
                  Join {FIRST_NAME} for
                </span>
                <span
                  style={{
                    display: 'flex',
                    margin: 0,
                    color: STYLING_CONGIF[ticketType].FOREGROUND,
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
                  color: STYLING_CONGIF[ticketType].FOREGROUND_LIGHT,
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

    // Remove. Use only for local testing.
    // return await generatedTicketImage
    // // Upload image to storage.
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
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}
