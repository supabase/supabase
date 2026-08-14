import type { Metadata } from 'next'

import { FrameworksSection } from './_components/FrameworksSection'
import { HomeContent } from './_components/HomeContent'
import { mdAlternates } from '@/lib/md-alternates'

export const metadata: Metadata = {
  alternates: mdAlternates('homepage'),
}

export default function HomePage() {
  return <HomeContent frameworksSlot={<FrameworksSection />} />
}
