import type { Metadata } from 'next'

import { WorkersContent } from './_components/WorkersContent'
import { mdAlternates } from '@/lib/md-alternates'

export const metadata: Metadata = {
  title: 'Workers | Supabase',
  description:
    'Run AI-agent sandboxes and production backends on one runtime, next to your database. Now in Private Alpha.',
  alternates: mdAlternates('workers'),
}

export default function WorkersPage() {
  return <WorkersContent />
}
