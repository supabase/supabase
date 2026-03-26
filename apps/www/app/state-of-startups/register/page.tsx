import type { Metadata } from 'next'
import { RegisterContent } from './RegisterContent'

export const metadata: Metadata = {
  title: 'State of Startups 2026 — Register | Supabase',
  description: 'Be the first to access the State of Startups 2026 report.',
}

export default function RegisterPage() {
  return <RegisterContent />
}
