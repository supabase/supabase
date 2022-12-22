import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts'
import Docs from './component/Docs.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

const options = {
  width: 1200,
  height: 600,
  status: 200,
  headers: {
    'content-type': 'image/png',
    'cache-control': 'public, max-age=31536000, s-maxage=31536000, no-transform, immutable',
    'cdn-cache-control': 'max-age=31536000',
  },
}

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

  if (site === 'docs') {
    return new ImageResponse(( <Docs title={title} description={description} type={type} icon={icon} /> ), { ...options })
  }

  return new Response(JSON.stringify({error: 'Internal server error'}), {
    headers: { ...corsHeaders },
    status: 500
  })
}
