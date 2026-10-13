import type { Metadata } from 'next'

import { ComputeContent } from './_components/ComputeContent'
import { mdAlternates } from '@/lib/md-alternates'

export const metadata: Metadata = {
  title: 'Compute | Supabase',
  description:
    'Run AI-agent sandboxes and production backends on one runtime, next to your database. Now in Private Alpha.',
  alternates: mdAlternates('compute'),
}

export default function ComputePage() {
  return <ComputeContent />
}
