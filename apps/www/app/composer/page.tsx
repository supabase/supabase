import type { Metadata } from 'next'

import { createProjectComposerTemplateSource } from './lib/template-source'
import ProjectComposerClient from './ProjectComposerClient'

export const metadata: Metadata = {
  title: 'Project Composer | Supabase',
  description:
    'Compose Supabase project templates, preview the generated files, and export a project scaffold.',
  openGraph: {
    title: 'Project Composer | Supabase',
    description:
      'Compose Supabase project templates, preview the generated files, and export a project scaffold.',
    url: 'https://supabase.com/composer',
    images: [
      {
        url: 'https://supabase.com/images/og/supabase-og.png',
      },
    ],
  },
}

export default async function ProjectComposerPage() {
  const templateSource = createProjectComposerTemplateSource()
  const templates = await templateSource.listTemplates()

  return <ProjectComposerClient templates={templates} />
}
