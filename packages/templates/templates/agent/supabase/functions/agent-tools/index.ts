import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from 'jsr:@supabase/supabase-js@2'

type ToolRequest = {
  tool: string
  arguments: Record<string, unknown>
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('expected POST request', { status: 405 })
  }

  let body: ToolRequest

  try {
    body = await req.json()
  } catch {
    return new Response('invalid JSON body', { status: 400 })
  }

  if (!body.tool || typeof body.tool !== 'string') {
    return new Response('tool name is required', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  switch (body.tool) {
    case 'list_sessions': {
      const { data, error } = await supabase
        .from('agent_sessions')
        .select('id, title, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        return Response.json({ error: error.message }, { status: 500 })
      }

      return Response.json({ tool: body.tool, result: data })
    }

    case 'search_memories': {
      const query = String(body.arguments?.query ?? '')

      const { data, error } = await supabase
        .from('agent_memories')
        .select('id, role, content, state, created_at')
        .ilike('content', `%${query}%`)
        .limit(10)

      if (error) {
        return Response.json({ error: error.message }, { status: 500 })
      }

      return Response.json({ tool: body.tool, result: data })
    }

    default:
      return Response.json(
        {
          error: `unknown tool: ${body.tool}`,
          availableTools: ['list_sessions', 'search_memories'],
        },
        { status: 400 }
      )
  }
})
