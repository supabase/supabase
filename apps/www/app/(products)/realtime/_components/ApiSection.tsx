import { createHighlighter, type ThemeRegistration } from 'shiki'
import { ApiSectionClient } from './ApiSectionClient'

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

const API_EXAMPLES = [
  {
    icon: 'Database' as const,
    title: 'Database changes',
    description: 'Listen to inserts, updates, and deletes in real time.',
    code: `import { createClient } from '@supabase/supabase-js'

const supabase = createClient('URL', 'ANON_KEY')
const channel = supabase
  .channel('db-changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
  }, (payload) => {
    console.log('New message:', payload.new)
  })
  .subscribe()`,
  },
  {
    icon: 'Users' as const,
    title: 'Presence',
    description: 'Track and synchronize online user state across clients.',
    code: `import { createClient } from '@supabase/supabase-js'

const supabase = createClient('URL', 'ANON_KEY')
const channel = supabase.channel('online-users')

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    console.log('Online users:', state)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user: 'user-123' })
    }
  })`,
  },
  {
    icon: 'Radio' as const,
    title: 'Broadcast',
    description: 'Send ephemeral messages to all subscribed clients instantly.',
    code: `import { createClient } from '@supabase/supabase-js'

const supabase = createClient('URL', 'ANON_KEY')
const channel = supabase.channel('cursor-pos')

channel
  .on('broadcast', { event: 'cursor' }, (payload) => {
    console.log('Cursor position:', payload)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.send({
        type: 'broadcast',
        event: 'cursor',
        payload: { x: 100, y: 200 },
      })
    }
  })`,
  },
]

export async function ApiSection() {
  const hl = await createHighlighter({
    themes: [supabaseDark, supabaseLight],
    langs: ['javascript'],
  })

  const examples = API_EXAMPLES.map((example) => ({
    icon: example.icon,
    title: example.title,
    description: example.description,
    darkHtml: hl.codeToHtml(example.code, { lang: 'javascript', theme: 'supabase-dark' }),
    lightHtml: hl.codeToHtml(example.code, { lang: 'javascript', theme: 'supabase-light' }),
  }))

  hl.dispose()

  return <ApiSectionClient examples={examples} />
}
