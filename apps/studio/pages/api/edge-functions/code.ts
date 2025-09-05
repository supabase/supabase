import { NextApiRequest, NextApiResponse } from 'next'
import type { CodeResponse } from 'components/interfaces/Functions/EdgeFunctionVersions/types'

// Mock code content for each version
const mockCodeContent = {
  3: `import { createClient } from '@supabase/supabase-js'

export default async function handler(req) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY')
  )
  
  // Authentication middleware
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const { data: user, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return new Response('Invalid token', { status: 401 })
  }
  
  return new Response(JSON.stringify({ user: user.user }), {
    headers: { 'Content-Type': 'application/json' }
  })
}`,
  2: `import { createClient } from '@supabase/supabase-js'

export default async function handler(req) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY')
  )
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  return new Response(JSON.stringify({ message: 'Hello World' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}`,
  1: `export default async function handler(req) {
  return new Response(JSON.stringify({ message: 'Hello World' }), {
    headers: { 'Content-Type': 'application/json' }
  })
}`,
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req
  const { version } = req.query

  if (method === 'GET') {
    const versionNumber = parseInt(version as string, 10)

    if (isNaN(versionNumber)) {
      return res.status(400).json({ message: 'Invalid version number' })
    }

    // Simulate network delay haha
    await new Promise((resolve) => setTimeout(resolve, 300))

    const content = mockCodeContent[versionNumber as keyof typeof mockCodeContent] || ''

    const response: CodeResponse = {
      version: versionNumber,
      files: [
        { path: 'index.ts', content },
        { path: 'import_map.json', content: '{}' },
      ],
    }

    return res.status(200).json(response)
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

export default handler
