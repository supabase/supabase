import type { Metadata } from 'next'

import { EdgeFunctionsContent } from './_components/EdgeFunctionsContent'

export const metadata: Metadata = {
  title: 'Edge Functions | Supabase',
  description:
    'Execute your code closest to your users with fast deploy times and low latency.',
}

export default function EdgeFunctionsPage() {
  return <EdgeFunctionsContent />
}
