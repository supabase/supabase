import supabaseLogoIcon from 'common/assets/images/supabase-logo-icon.png'
import { GoPageRenderer as MarketingPageRenderer } from 'marketing'
import type { CustomSectionRenderers } from 'marketing'
import Image from 'next/image'
import Link from 'next/link'

import TweetsSection from './TweetsSection'
import type { GoPage } from '@/types/go'

const customRenderers: CustomSectionRenderers = {
  tweets: TweetsSection,
}

// eslint-disable-next-line
export default function GoPageRenderer({ page }: { page: GoPage }) {
  return (
    <>
      <nav className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-[80rem] mx-auto flex items-center h-14 px-8">
          <Link href="/">
            <Image src={supabaseLogoIcon} width={24} height={24} alt="Supabase" priority />
            <span className="sr-only">Supabase</span>
          </Link>
        </div>
      </nav>

      <main className="relative min-h-screen pb-16 sm:pb-24">
        <MarketingPageRenderer page={page} customRenderers={customRenderers} />
      </main>
      <footer className="border-t border-muted">
        <div className="max-w-[80rem] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 py-4 sm:h-14 px-8 text-sm text-foreground-lighter">
          <span>&copy; {new Date().getFullYear()} Supabase Inc.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </>
  )
}
