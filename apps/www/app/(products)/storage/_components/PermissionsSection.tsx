import { createHighlighter, type ThemeRegistration } from 'shiki'
import { PermissionsSectionClient } from './PermissionsSectionClient'

const supabaseDark: ThemeRegistration = {
  name: 'supabase-dark',
  type: 'dark',
  colors: {
    'editor.background': '#00000000',
    'editor.foreground': '#ffffff',
  },
  tokenColors: [
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'], settings: { foreground: '#bda4ff' } },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: '#3ecf8e' } },
    { scope: ['constant', 'variable.other.constant', 'support.constant'], settings: { foreground: '#3ecf8e' } },
    { scope: ['string', 'string.quoted'], settings: { foreground: '#ffcda1' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7e7e7e' } },
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
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: '#15593b' } },
    { scope: ['constant', 'variable.other.constant', 'support.constant'], settings: { foreground: '#15593b' } },
    { scope: ['string', 'string.quoted'], settings: { foreground: '#f1a10d' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7e7e7e' } },
    { scope: ['punctuation'], settings: { foreground: '#a0a0a0' } },
    { scope: ['constant.numeric'], settings: { foreground: '#525252' } },
  ],
}

const PERMISSION_EXAMPLES = [
  {
    title: 'Public access to a bucket',
    description: 'Allow any user access to all objects in a bucket.',
    code: `create policy "Public Access"
on storage.objects for all
using ( bucket_id = 'avatars' );`,
  },
  {
    title: 'Public access to a folder',
    description: "Allow public CRUD access to a specific folder within a bucket.",
    code: `create policy "Public access to a folder"
on storage.objects for all
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = 'public'
);`,
  },
  {
    title: 'Authenticated access',
    description: 'Restrict access to authenticated users for a specific folder.',
    code: `create policy "Logged in access"
on storage.objects
for all using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = 'authenticated'
);`,
  },
  {
    title: 'Individual file access',
    description: 'Grant a specific user access to a single file by UID.',
    code: `create policy "Individual access"
on storage.objects for all
using (
  bucket_id = 'avatars'
  and name = 'folder/only_uid.jpg'
  and (select auth.uid()) = 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2'
);`,
  },
]

export async function PermissionsSection() {
  const hl = await createHighlighter({
    themes: [supabaseDark, supabaseLight],
    langs: ['sql'],
  })

  const examples = PERMISSION_EXAMPLES.map((example) => ({
    title: example.title,
    description: example.description,
    darkHtml: hl.codeToHtml(example.code, { lang: 'sql', theme: 'supabase-dark' }),
    lightHtml: hl.codeToHtml(example.code, { lang: 'sql', theme: 'supabase-light' }),
  }))

  hl.dispose()

  return <PermissionsSectionClient examples={examples} />
}
