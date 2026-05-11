import { createHighlighter, type ThemeRegistration } from 'shiki'
import { IntegratesSectionClient } from './IntegratesSectionClient'

const supabaseDark: ThemeRegistration = {
  name: 'supabase-dark',
  type: 'dark',
  colors: {
    'editor.background': '#00000000',
    'editor.foreground': '#ffffff',
  },
  tokenColors: [
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'], settings: { foreground: '#bda4ff' } },
    { scope: ['entity.name.function', 'support.function', 'entity.name.tag', 'support.class.component'], settings: { foreground: '#3ecf8e' } },
    { scope: ['constant', 'variable.other.constant', 'support.constant'], settings: { foreground: '#3ecf8e' } },
    { scope: ['variable.other.property', 'support.type.property-name', 'meta.object-literal.key', 'entity.other.attribute-name'], settings: { foreground: '#3ecf8e' } },
    { scope: ['string', 'string.quoted'], settings: { foreground: '#ffcda1' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7e7e7e' } },
    { scope: ['variable.parameter'], settings: { foreground: '#ffffff' } },
    { scope: ['punctuation'], settings: { foreground: '#ffffff' } },
    { scope: ['constant.numeric'], settings: { foreground: '#ededed' } },
  ],
}

const supabaseLight: ThemeRegistration = {
  name: 'supabase-light',
  type: 'light',
  colors: {
    'editor.background': '#00000000',
    'editor.foreground': '#525252',
  },
  tokenColors: [
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'], settings: { foreground: '#6b35dc' } },
    { scope: ['entity.name.function', 'support.function', 'entity.name.tag', 'support.class.component'], settings: { foreground: '#15593b' } },
    { scope: ['constant', 'variable.other.constant', 'support.constant'], settings: { foreground: '#15593b' } },
    { scope: ['variable.other.property', 'support.type.property-name', 'meta.object-literal.key', 'entity.other.attribute-name'], settings: { foreground: '#15593b' } },
    { scope: ['string', 'string.quoted'], settings: { foreground: '#f1a10d' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7e7e7e' } },
    { scope: ['variable.parameter'], settings: { foreground: '#525252' } },
    { scope: ['punctuation'], settings: { foreground: '#a0a0a0' } },
    { scope: ['constant.numeric'], settings: { foreground: '#525252' } },
  ],
}

const USE_CASES = [
  {
    icon: 'Zap' as const,
    label: 'Zero configuration',
    paragraph: 'Pre-populated environment variables required to access your Supabase project',
    lang: 'javascript' as const,
    code: `import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async () => {
  // These are automatically available — no setup needed
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  )

  const { data } = await supabase.from('todos').select('*')
  return new Response(JSON.stringify(data))
})`,
  },
  {
    icon: 'Database' as const,
    label: 'Connect to your database',
    paragraph: 'Connect to your Postgres database from an Edge Function using the supabase-js client',
    lang: 'javascript' as const,
    code: `const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  {
    global: {
      headers: {
        Authorization: req.headers.get('Authorization')!
      }
    }
  }
)

const { data, error } = await supabase
  .from('countries')
  .select('*')`,
  },
  {
    icon: 'Webhook' as const,
    label: 'Trigger via webhook',
    paragraph: 'Database Webhooks send real-time data from your database whenever a table event occurs',
    lang: 'sql' as const,
    code: `create trigger "my_webhook" after insert
on "public"."my_table" for each row
execute function "supabase_functions"."http_request"(
  'http://localhost:3000',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '1000'
);`,
  },
  {
    icon: 'Shield' as const,
    label: 'Works with Supabase Auth',
    paragraph: 'Verify users and enforce permissions directly inside your Edge Functions',
    lang: 'javascript' as const,
    code: `import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  // Create supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: {
        headers: {
          Authorization: req.headers.get('Authorization')!}
        }
    }
  )

  // Get the session or user object
  const { data } = await supabase.auth.getUser()
  const user = data.user
})`,
  },
  {
    icon: 'HardDrive' as const,
    label: 'Works with Supabase Storage',
    paragraph: 'Upload, transform, and serve files with built-in caching from your Edge Functions',
    lang: 'javascript' as const,
    code: `import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  // Create supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Upload image to storage
  const { data, error } = await supabase.storage
    .from('images')
    .upload('filename.png', file, {
      contentType: 'image/png',
      cacheControl: '31536000',
      upsert: false,
    })
})`,
  },
]

export async function IntegratesSection() {
  const hl = await createHighlighter({
    themes: [supabaseDark, supabaseLight],
    langs: ['javascript', 'sql'],
  })

  const useCases = USE_CASES.map((useCase) => ({
    icon: useCase.icon,
    label: useCase.label,
    paragraph: useCase.paragraph,
    darkHtml: hl.codeToHtml(useCase.code, { lang: useCase.lang, theme: 'supabase-dark' }),
    lightHtml: hl.codeToHtml(useCase.code, { lang: useCase.lang, theme: 'supabase-light' }),
  }))

  hl.dispose()

  return <IntegratesSectionClient useCases={useCases} />
}
