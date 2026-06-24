import type { Metadata } from 'next'

import { ApiSection } from './_components/ApiSection'
import { RealtimeContent } from './_components/RealtimeContent'

export const metadata: Metadata = {
  title: 'Realtime | Supabase',
  description:
    'Sync client state globally over WebSockets. Listen to database changes, store user presence, and broadcast messages in real time.',
}

export default function RealtimePage() {
  return <RealtimeContent apiSlot={<ApiSection />} />
}
