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
// const FONT_URL = `${STORAGE_URL}/assets/font/Nippo-Regular.otf`
// const MONO_FONT_URL = `${STORAGE_URL}/assets/font/DepartureMono-Regular.otf`

const FONT_URL = '/fonts/launchweek/14/Nippo-Regular.otf'
const MONO_FONT_URL = '/fonts/launchweek/14/DepartureMono-Regular.otf'

const LW_TABLE = 'tickets'
const LW_MATERIALIZED_VIEW = 'tickets_view'

const usernameToLines = (username: string): string[] => {
  const maxLineLength = 14

  const nonBreakingReplacements = [
    { regexp: new RegExp(' ', 'g'), replacement: '\u00A0' }, // Space → Non-breaking space
    { regexp: new RegExp('-', 'g'), replacement: '\u2011' }, // Hyphen → Non-breaking hyphen
    { regexp: new RegExp('/', 'g'), replacement: '\u2060\u002F\u2060' }, // Slash with word joiners
    { regexp: new RegExp('\\.', 'g'), replacement: '\u2024' }, // One dot leader (alternative to period)
  ]
  const allowList = [...nonBreakingReplacements.map((x) => x.regexp), new RegExp('\\w', 'g')]
    .map((x) => x.source.replace('-', '\\-'))
    .join('|')
  const allowRegexp = new RegExp(`[^${allowList}]`, 'g')
  const allowdUsername = username.replace(allowRegexp, '')
  // Split only by spaces, keeping hyphenated words together
  const words = allowdUsername.split(' ')
  const lines: string[] = []
  let currentLine = ''

  // First try to break at word boundaries (spaces only)
  for (const word of words) {
    // If adding this word would exceed the line length and we already have content
    if (
      currentLine.length + (currentLine ? 1 : 0) + word.length > maxLineLength &&
      currentLine.length > 0
    ) {
      // Add current line to lines array and start a new line
      lines.push(currentLine)
      currentLine = word
    } else {
      // Add word to current line with a space if needed
      currentLine = currentLine ? `${currentLine} ${word}` : word
    }
  }

  // Add the last line if it has content
  if (currentLine) {
    lines.push(currentLine)
  }

  // If we still have too few lines but some are too long, split them by character
  // but try to avoid splitting at hyphens
  let finalLines: string[] = []
  for (const line of lines) {
    if (line.length > maxLineLength) {
      // For long words, try to find good break points
      let remainingText = line
      while (remainingText.length > 0) {
        if (remainingText.length <= maxLineLength) {
          finalLines.push(remainingText)
          break
        }

        // Try to find a good break point that's not a hyphen
        let breakPoint = maxLineLength

        // Look for a hyphen in the potential break area (a few chars before maxLineLength)
        const searchArea = remainingText.substring(Math.max(0, breakPoint - 5), breakPoint + 1)
        const hyphenPos = searchArea.indexOf('-')

        // If we found a hyphen, adjust the break point to keep the hyphenated word together
        if (hyphenPos >= 0) {
          // Calculate the actual position in the original string
          const actualHyphenPos = Math.max(0, breakPoint - 5) + hyphenPos

          // If hyphen is near the beginning, include the whole hyphenated word on next line
          if (actualHyphenPos < maxLineLength / 2) {
            breakPoint = actualHyphenPos
          }
          // If hyphen is near the end, include the whole hyphenated word on this line
          else {
            // Find the end of the hyphenated word
            const spaceAfterHyphen = remainingText.indexOf(' ', actualHyphenPos)
            if (spaceAfterHyphen > 0 && spaceAfterHyphen - actualHyphenPos < 10) {
              // If the rest of the hyphenated word is reasonably short, keep it together
              breakPoint = spaceAfterHyphen
            }
          }
        }

        finalLines.push(remainingText.substring(0, breakPoint))
        remainingText = remainingText.substring(breakPoint).trim()
      }
    } else {
      finalLines.push(line)
    }
  }

  // Limit to 3 lines maximum
  if (finalLines.length > 3) {
    finalLines = finalLines.slice(0, 2)
    // Truncate the last line if needed and add ellipsis
    let lastLine = finalLines[2] || ''
    if (lastLine.length > 8) {
      lastLine = lastLine.slice(0, 8) + '...'
    }
    finalLines.push(lastLine)
  }

  finalLines = finalLines.map((line, index) => {
    let result = line
    nonBreakingReplacements.forEach(({ regexp, replacement }) => {
      result = result.replace(regexp, replacement)
    })

    if (index < finalLines.length - 1) {
      result = result.padEnd(maxLineLength, '\u00A0')
    }
    return result
  })

  // Ensure we don't have more than 3 lines
  return finalLines.slice(0, 3)
}

export async function GET(req: Request, res: Response) {
  const url = new URL(req.url)

  // Just here to silence snyk false positives
  // Verify that req.url is from an allowed domain
  const username = url.searchParams.get('username') ?? url.searchParams.get('amp;username')
  const userAgent = req.headers.get('user-agent')

  const font = fetch(new URL(FONT_URL, url)).then((res) => res.arrayBuffer())
  const mono_font = fetch(new URL(MONO_FONT_URL, url)).then((res) => res.arrayBuffer())

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
    const platinumSecret = platinum && secret

    const seatCode = (466561 + (ticket_number || 0)).toString(36).toUpperCase()

    // Generate image and upload to storage.
    const ticketType = secret
      ? platinum
        ? 'platinumSecret'
        : 'secret'
      : platinum
        ? 'platinum'
        : 'regular'

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
      platinumSecret: {
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
        BACKGROUND_IMG: new URL(`/images/launchweek/14/og-14-regular.png`, url).href,
      },
      platinum: {
        BACKGROUND_IMG: new URL(`/images/launchweek/14/og-14-platinum.png`, url).href,
      },
      platinumSecret: {
        BACKGROUND_IMG: new URL(`/images/launchweek/14/og-14-platinum-secret.png`, url).href,
      },
      secret: {
        BACKGROUND_IMG: new URL(`/images/launchweek/14/og-14-secret.png`, url).href,
      },
    })

    const NOISE = new URL('/images/launchweek/14/noise-pattern.png', url).href

    const computeBackgroundWidth = (letters: number) => {
      return 100 + (letters * 40 + (letters - 1) * 12)
    }
    const lines = usernameToLines(name ?? username)

    const secretStyles = {
      background: 'linear-gradient(0deg, rgb(18 18 18 / 0.5) 50%, transparent 50%)',
      backgroundSize: '100% 6px, 0px 100%',
    }

    const testStyles = {
      background: 'red',
      backgroundSize: '100% 6px, 0px 100%',
    }

    const secretTextStyles = {
      textShadow: '0 0 15px rgba(52,211,153,0.8)',
    }

    const platinumSecretTextStyles = {
      textShadow: '0 0 15px rgba(255,199,58,0.8)',
    }

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
                ...(secret ? secretTextStyles : {}),
                ...(platinumSecret ? platinumSecretTextStyles : {}),
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
                    ...(secret ? secretTextStyles : {}),
                    ...(platinumSecret ? platinumSecretTextStyles : {}),
                  }}
                >
                  {line}
                </p>
              </div>
            ))}

            {secret && (
              <div
                style={{
                  position: 'absolute',
                  top: '0px',
                  left: '0px',
                  right: '0px',
                  bottom: '0px',
                  ...secretStyles,
                }}
              />
            )}

            {secret && (
              <img
                src={NOISE}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: '0.1',
                }}
              />
            )}
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
    // return generatedTicketImage

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
