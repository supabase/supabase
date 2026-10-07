import type { Metadata } from 'next'

import { ApiSection } from './_components/ApiSection'
import { DatabaseContent } from './_components/DatabaseContent'
import { mdAlternates } from '@/lib/md-alternates'

export const metadata: Metadata = {
  title: 'Database | Supabase',
  description:
    'Every Supabase project is a dedicated Postgres database. Use it on its own, or with the rest of the Supabase platform. 100% portable with no vendor lock-in.',
  alternates: mdAlternates('database'),
}

export default function DatabasePage() {
  return <DatabaseContent apiSlot={<ApiSection />} />
}
