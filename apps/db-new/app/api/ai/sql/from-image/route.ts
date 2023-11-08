import { createClient } from '@supabase/supabase-js'
import { codeBlock } from 'common-tags'
import OpenAI from 'openai'

const openai = new OpenAI()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
})

/**
 * Note: currently images are passed to OpenAI's vision model
 * using Supabase storage (signed URLs).
 *
 * You will need a Supabase project (set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 * for this to work.
 */
export async function POST(req: Request) {
  if (!req.body) {
    return Response.error()
  }

  const { data: storageObject, error: storageObjectError } = await supabase.storage
    .from('image-staging')
    .upload(crypto.randomUUID(), req.body, { duplex: 'half' })

  console.log(storageObject)

  if (storageObjectError) {
    console.error(storageObjectError)
    return Response.json({}, { status: 500 })
  }

  const { data: signedUrlObject, error: signedUrlError } = await supabase.storage
    .from('image-staging')
    .createSignedUrl(storageObject.path, 60)

  if (signedUrlError) {
    console.error(signedUrlError)
    return Response.json({}, { status: 500 })
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    max_tokens: 1024,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: codeBlock`
          You are a Postgres SQL generator who can only speak SQL, nothing else.

          Your job is to generate Postgres SQL based on a database diagram image.

          Output as SQL using the following instructions:
          - The generated SQL must be valid SQL.
          - For primary keys, always use "id bigint primary key generated always as identity" (not serial)
          - Prefer creating foreign key references in the create statement
          - Prefer 'text' over 'varchar'
          - Prefer 'timestamp with time zone' over 'date'
          - Use vector(384) data type for any embedding/vector related query
          - Always use double apostrophe in SQL strings (eg. 'Night''s watch')
          - Omit \`\`\`sql from your reply
        `,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: signedUrlObject.signedUrl,
            },
          },
        ],
      },
    ],
  })

  console.log(response.choices[0].message.content)

  return Response.json({ sql: response.choices[0].message.content })
}
