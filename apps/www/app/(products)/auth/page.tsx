import type { Metadata } from 'next'

import { ApiSection } from './_components/ApiSection'
import { AuthContent } from './_components/AuthContent'
import { RLSSection } from './_components/RLSSection'
import { mdAlternates } from '@/lib/md-alternates'

export const metadata: Metadata = {
  title: 'Auth | Supabase',
  description:
    'Add user sign ups and logins to your app. Secure your data with Row Level Security. Works with all major OAuth providers.',
  alternates: mdAlternates('auth'),
}

export default function AuthPage() {
  return <AuthContent apiSlot={<ApiSection />} rlsSlot={<RLSSection />} />
}
