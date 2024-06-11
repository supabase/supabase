import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts'
import CustomerStories from './component/CustomerStories.tsx'
import Docs from './component/Docs.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// Load custom font
const FONT_URLS = {
  CIRCULAR:
    'https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/fonts/CircularStd-Book.otf',
  MONO: 'https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/fonts/SourceCodePro-Regular.ttf',
}
const FONT_CIRCULAR = fetch(new URL(FONT_URLS['CIRCULAR'], import.meta.url)).then((res) =>
  res.arrayBuffer()
)
const FONT_MONO = fetch(new URL(FONT_URLS['MONO'], import.meta.url)).then((res) =>
  res.arrayBuffer()
)
const CIRCULAR_FONT_DATA = await FONT_CIRCULAR
const MONO_FONT_DATA = await FONT_MONO

export async function handler(req: Request) {
  const url = new URL(req.url)

  const site =
    url.searchParams.get('site')?.toLowerCase() ?? url.searchParams.get('amp;site')?.toLowerCase()
  const icon =
    url.searchParams.get('icon')?.toLowerCase() ?? url.searchParams.get('amp;icon')?.toLowerCase()
  const customer =
    url.searchParams.get('customer')?.toLowerCase() ??
    url.searchParams.get('amp;customer')?.toLowerCase()
  const type = url.searchParams.get('type') ?? url.searchParams.get('amp;type')
  const title = url.searchParams.get('title') ?? url.searchParams.get('amp;title')
  const description = url.searchParams.get('description') ?? url.searchParams.get('amp;description')

  if (!site || !title) {
    return new Response(JSON.stringify({ message: 'missing params' }), {
      headers: { ...corsHeaders },
      status: 404,
    })
  }

  switch (site) {
    case 'docs':
      return new ImageResponse(
        (
          <Docs
            title={title}
            description={description !== 'undefined' ? description : ''}
            type={type}
            icon={icon}
          />
        ),
        {
          width: 1200,
          height: 630,
          fonts: [
            {
              name: 'Circular',
              data: CIRCULAR_FONT_DATA,
              style: 'normal',
            },
            {
              name: 'SourceCode',
              data: MONO_FONT_DATA,
              style: 'mono',
            },
          ],
          headers: {
            'content-type': 'image/png',
            'cache-control': 'public, max-age=31536000, s-maxage=31536000, no-transform, immutable',
            'cdn-cache-control': 'max-age=31536000',
          },
        }
      )
      break
    case 'customers':
      return new ImageResponse(<CustomerStories title={title} customer={customer} />, {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Circular',
            data: fontData,
            style: 'normal',
          },
        ],
        headers: {
          'content-type': 'image/png',
          'cache-control': 'public, max-age=31536000, s-maxage=31536000, no-transform, immutable',
          'cdn-cache-control': 'max-age=31536000',
        },
      })
      break
    default:
      return new Response(JSON.stringify({ message: 'site not found' }), {
        headers: { ...corsHeaders },
        status: 404,
      })
      break
  }
}
