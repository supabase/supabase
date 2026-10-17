import type { Metadata } from 'next'

import { EdgeFunctionsContent } from './_components/EdgeFunctionsContent'
import { mdAlternates } from '@/lib/md-alternates'

export const metadata: Metadata = {
  title: 'Edge Functions | Supabase',
  description: 'Execute your code closest to your users with fast deploy times and low latency.',
  alternates: mdAlternates('edge-functions'),
}

export default function EdgeFunctionsPage() {
  return <EdgeFunctionsContent />
}
