import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts'
import Docs from './component/Docs.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

// Load custom font
const FONT_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw6/CircularStd-Book.otf'
const font = fetch(new URL(FONT_URL, import.meta.url)).then((res) => res.arrayBuffer())
const fontData = await font

export async function handler(req: Request) {
  const url = new URL(req.url)
  const site = url.searchParams.get('site')?.toLowerCase() ?? url.searchParams.get('amp;site')?.toLowerCase()
  const icon = url.searchParams.get('icon')?.toLowerCase() ?? url.searchParams.get('amp;icon')?.toLowerCase()
  const type = url.searchParams.get('type') ?? url.searchParams.get('amp;type')
  const title = url.searchParams.get('title') ?? url.searchParams.get('amp;title')
  const description = url.searchParams.get('description') ?? url.searchParams.get('amp;description')

  if(!site || !title || !description) {
    return new Response(JSON.stringify({ message: 'missing params' }), {
      headers: { ...corsHeaders },
      status: 404,
    })
  }

  switch (site) {
    case 'docs':
      return new ImageResponse(( <Docs title={title} description={description} type={type} icon={icon} /> ),
        {
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
      break;
  
    default:
      return new Response(JSON.stringify({message: 'site not found'}), {
        headers: { ...corsHeaders },
        status: 404,
      })
      break;
  }
}
