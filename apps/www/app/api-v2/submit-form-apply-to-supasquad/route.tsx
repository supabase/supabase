import z from 'zod'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_DB_ID = process.env.NOTION_DB_ID

const applicationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  tracks: z.array(z.string()).min(1, "Select at least 1 track"),
  areas_of_interest: z.array(z.string()).min(1, "Select at least 1 area of interest"),
  why_you_want_to_join: z.string().min(1, "This is required"),
  monthly_commitment: z.string().min(1, "This is required"),
  languages_spoken: z.array(z.string()).min(1, "Select at least 1 language"),
  skills: z.string().min(1, "This is required"),
  location: z.string().min(1, "Make sure to specify your city and country"),
  github: z.string().optional(),
  twitter: z.string().optional(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
}

export async function OPTIONS() {
  return new Response('ok', { headers: corsHeaders })
}

function truncateRichText(s: string, max = 1900) {
  if (!s) return ''
  return s.length > max ? s.slice(0, max) + '…' : s
}

function asMultiSelect(values: string[]) {
  return values.map(v => ({ name: v }))
}

function normalizeTrack(t: string) {
  if (t === 'Builder/Maintainer') return 'Builder / Maintainer'
  return t
}

async function getTitlePropertyName(dbId: string, apiKey: string): Promise<string> {
  const resp = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
    },
  })
  if (!resp.ok) throw new Error('Failed to retrieve database metadata')
  const db: any = await resp.json()
  const entry = Object.entries(db.properties).find(([, v]: any) => v?.type === 'title')
  if (!entry) throw new Error('No title property found in database')
  return entry[0]
}

export async function POST(req: Request) {
  if (!NOTION_API_KEY || !NOTION_DB_ID) {
    return new Response(JSON.stringify({ message: 'Server misconfigured: missing Notion credentials' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ message: 'Invalid JSON' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  const parsed = applicationSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ message: parsed.error.flatten() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 422,
    })
  }

  const data = parsed.data
  let titleProp: string
  try {
    titleProp = await getTitlePropertyName(NOTION_DB_ID, NOTION_API_KEY)
  } catch (e: any) {
    return new Response(JSON.stringify({ message: e.message || 'Cannot read Notion DB schema' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }

  const fullName = `${data.firstName?.trim() || ''} ${data.lastName?.trim() || ''}`.trim() || 'Unnamed'

  const props: Record<string, any> = {
    [titleProp]: {
      title: [{ type: 'text', text: { content: fullName } }],
    },
    'Email': { email: data.email },
    'What track would you like to be considered for?': {
      multi_select: asMultiSelect(data.tracks.map(normalizeTrack)),
    },
    'Product areas of interest': {
      multi_select: asMultiSelect(data.areas_of_interest),
    },
    'Languages spoken': {
      multi_select: asMultiSelect(data.languages_spoken),
    },
    'Date submitted': {
      date: { start: new Date().toISOString().split('T')[0] },
    },
  }
  if (data.monthly_commitment) {
    // Adjust property key to match your Notion DB (case & spacing sensitive)
    props['Monthly commitment'] = {
      rich_text: [
        {
          type: 'text',
          text: { content: truncateRichText(data.monthly_commitment, 120) },
        },
      ],
    }
  }
  if (data.skills) {
    props['Skills (frameworks, tools, languages)'] = {
      rich_text: [{ type: 'text', text: { content: truncateRichText(data.skills) } }],
    }
  }
  if (data.why_you_want_to_join) {
    props['Why do you want to join the program'] = {
      rich_text: [{ type: 'text', text: { content: truncateRichText(data.why_you_want_to_join, 1800) } }],
    }
  }
  if (data.location) {
    props['Location'] = {
      rich_text: [{ type: 'text', text: { content: truncateRichText(data.location, 120) } }],
    }
    try {
      const maybeCountry = data.location.split(',').slice(-1)[0]?.trim()
      if (maybeCountry) props['Region'] = { multi_select: [{ name: maybeCountry }] }
    } catch {/* ignore */ }
  }
  if (data.github) {
    props['GitHub Profile'] = {
      rich_text: [{ type: 'text', text: { content: data.github } }],
    }
  }
  if (data.twitter) {
    props['Twitter handle'] = {
      rich_text: [{ type: 'text', text: { content: data.twitter } }],
    }
  }

  try {
    const notionRequest = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { type: 'database_id', database_id: NOTION_DB_ID },
        properties: props,
      }),
    })

    const json = await notionRequest.json()

    if (notionRequest.ok) {
      return new Response(JSON.stringify({ message: 'Submission successful', id: json.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      })
    }

    return new Response(
      JSON.stringify({
        message: 'Notion API error',
        error: json?.message,
        details: json,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ message: 'Notion API error', error: err?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
    )
  }
}
