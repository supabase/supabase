import { createClient } from '@supabase/supabase-js'
import type { LogoUploadResponse } from '~/data/partners/partnerApplication.utils'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
}

export async function OPTIONS() {
  return new Response('ok', { headers: corsHeaders })
}

interface UploadUrlRequest {
  slug: string
  fileExtension: string
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_MISC_USE_URL
  const supabaseServiceKey = process.env.MISC_USE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Server misconfigured: missing Supabase credentials' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }

  let body: UploadUrlRequest
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  const { slug, fileExtension } = body

  if (!slug || !fileExtension) {
    return new Response(JSON.stringify({ error: 'slug and fileExtension are required' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'Invalid slug format' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  // Validate file extension
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const normalizedExtension = fileExtension.toLowerCase().replace('.', '')
  if (!allowedExtensions.includes(normalizedExtension)) {
    return new Response(
      JSON.stringify({ error: `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const path = `integrations/${slug}/logo.${normalizedExtension}`

    const { data, error } = await supabase.storage
      .from('images')
      .createSignedUploadUrl(path, { upsert: true })

    if (error) {
      console.error('Error creating signed URL:', error)
      return new Response(JSON.stringify({ error: 'Error creating upload URL' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/images/${path}`

    const response: LogoUploadResponse = {
      signedUrl: data.signedUrl,
      path: data.path,
      publicUrl,
      token: data.token,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error creating signed URL:', error)
    return new Response(JSON.stringify({ error: 'Error creating upload URL' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}
