import type { Metadata } from 'next'

import { ApiSection } from './_components/ApiSection'
import { AuthContent } from './_components/AuthContent'
import { RLSSection } from './_components/RLSSection'

export const metadata: Metadata = {
  title: 'Auth | Supabase',
  description:
    'Add user sign ups and logins to your app. Secure your data with Row Level Security. Works with all major OAuth providers.',
}

export default function AuthPage() {
  return <AuthContent apiSlot={<ApiSection />} rlsSlot={<RLSSection />} />
}
