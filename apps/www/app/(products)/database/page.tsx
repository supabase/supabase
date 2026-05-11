import type { Metadata } from 'next'

import { ApiSection } from './_components/ApiSection'
import { DatabaseContent } from './_components/DatabaseContent'

export const metadata: Metadata = {
  title: 'Database | Supabase',
  description:
    'Every Supabase project is a dedicated PostgreSQL database. 100% portable with no vendor lock-in.',
}

export default function DatabasePage() {
  return <DatabaseContent apiSlot={<ApiSection />} />
}
