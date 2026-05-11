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

const LANG_MAP: Record<string, string> = {
  JavaScript: 'javascript',
  Flutter: 'dart',
  Python: 'python',
  'C#': 'csharp',
  Kotlin: 'kotlin',
  Swift: 'swift',
}

const API_EXAMPLES = [
  {
    icon: 'Upload' as const,
    title: 'Upload a file',
    description: 'Upload any file type to your storage buckets with a single call.',
    code: {
      JavaScript: `// Upload an image to the "avatars" bucket
const spaceCat = event.target.files[0]
const { data, error } = await supabase
  .storage
  .from('avatars')
  .upload('space-cat.png', spaceCat)`,
      Flutter: `// Upload an image to the "avatars" bucket
final file = File('space-cat.png');
await supabase
  .storage
  .from('avatars')
  .upload('space-cat.png', file);`,
      Python: `# Upload an image to the "avatars" bucket
with open("space-cat.png", "rb") as f:
    supabase.storage.from_("avatars").upload(
        "space-cat.png", f
    )`,
      'C#': `// Upload an image to the "avatars" bucket
var bytes = File.ReadAllBytes("space-cat.png");
await supabase.Storage
  .From("avatars")
  .Upload(bytes, "space-cat.png");`,
      Kotlin: `// Upload an image to the "avatars" bucket
supabase.storage.from("avatars")
  .upload("space-cat.png", file)`,
      Swift: `// Upload an image to the "avatars" bucket
let data = try Data(contentsOf: fileURL)
try await supabase.storage
  .from("avatars")
  .upload("space-cat.png", data: data)`,
    },
  },
  {
    icon: 'Download' as const,
    title: 'Download a file',
    description: 'Retrieve files from your buckets directly or via signed URLs.',
    code: {
      JavaScript: `// Download the "space-cat.png" from "avatars"
const { data, error } = await supabase
  .storage
  .from('avatars')
  .download('space-cat.png')`,
      Flutter: `// Download the "space-cat.png" from "avatars"
final bytes = await supabase
  .storage
  .from('avatars')
  .download('space-cat.png');`,
      Python: `# Download the "space-cat.png" from "avatars"
data = supabase.storage.from_("avatars") \\
    .download("space-cat.png")`,
      'C#': `// Download the "space-cat.png" from "avatars"
var bytes = await supabase.Storage
  .From("avatars")
  .Download("space-cat.png");`,
      Kotlin: `// Download the "space-cat.png" from "avatars"
val bytes = supabase.storage.from("avatars")
  .downloadAuthenticated("space-cat.png")`,
      Swift: `// Download the "space-cat.png" from "avatars"
let data = try await supabase.storage
  .from("avatars")
  .download(path: "space-cat.png")`,
    },
  },
  {
    icon: 'List' as const,
    title: 'List files',
    description: 'Browse and list all files within a storage bucket.',
    code: {
      JavaScript: `// List all the files in the "avatars" bucket
const { data, error } = await supabase
  .storage
  .from('avatars')
  .list()`,
      Flutter: `// List all the files in the "avatars" bucket
final files = await supabase
  .storage
  .from('avatars')
  .list();`,
      Python: `# List all the files in the "avatars" bucket
files = supabase.storage.from_("avatars") \\
    .list()`,
      'C#': `// List all the files in the "avatars" bucket
var files = await supabase.Storage
  .From("avatars")
  .List();`,
      Kotlin: `// List all the files in the "avatars" bucket
val files = supabase.storage.from("avatars")
  .list()`,
      Swift: `// List all the files in the "avatars" bucket
let files = try await supabase.storage
  .from("avatars")
  .list()`,
    },
  },
  {
    icon: 'ArrowRightLeft' as const,
    title: 'Move and rename',
    description: 'Organize your files by moving and renaming within or across buckets.',
    code: {
      JavaScript: `// Move and rename files
const { data, error } = await supabase
  .storage
  .from('avatars')
  .move('public/space-cat.png', 'private/space-cat.png')`,
      Flutter: `// Move and rename files
await supabase
  .storage
  .from('avatars')
  .move('public/space-cat.png', 'private/space-cat.png');`,
      Python: `# Move and rename files
supabase.storage.from_("avatars") \\
    .move("public/space-cat.png", "private/space-cat.png")`,
      'C#': `// Move and rename files
await supabase.Storage
  .From("avatars")
  .Move("public/space-cat.png", "private/space-cat.png");`,
      Kotlin: `// Move and rename files
supabase.storage.from("avatars")
  .move("public/space-cat.png", "private/space-cat.png")`,
      Swift: `// Move and rename files
try await supabase.storage
  .from("avatars")
  .move(
    from: "public/space-cat.png",
    to: "private/space-cat.png"
  )`,
    },
  },
]

export async function ApiSection() {
  const hl = await createHighlighter({
    themes: [supabaseDark, supabaseLight],
    langs: Object.values(LANG_MAP),
  })

  const examples = API_EXAMPLES.map((example) => ({
    icon: example.icon,
    title: example.title,
    description: example.description,
    languages: Object.fromEntries(
      Object.entries(example.code).map(([lang, code]) => [
        lang,
        {
          darkHtml: hl.codeToHtml(code, { lang: LANG_MAP[lang], theme: 'supabase-dark' }),
          lightHtml: hl.codeToHtml(code, { lang: LANG_MAP[lang], theme: 'supabase-light' }),
        },
      ])
    ),
  }))

  hl.dispose()

  return <ApiSectionClient examples={examples} />
}
