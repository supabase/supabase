import type { GoPageInput } from 'marketing'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from 'ui'

import authors from '@/lib/authors.json'

const speaker = authors.find((a) => a.author_id === 'sugu_sougoumarane')

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'dash-2026/contest',
  metadata: {
    title: 'Win a MacBook Neo | Supabase at DASH 2026',
    description:
      'Create a Supabase account and load data for a chance to win a MacBook Neo. DASH 2026.',
  },
  hero: {
    title: 'Win a MacBook Neo',
    subtitle: 'Supabase at DASH 2026',
    description:
      "Great meeting you at DASH. Try Supabase if you haven't already -- it's Postgres with all the tools you need to build AI-native applications. We're running a sweepstakes with a MacBook Neo as the prize.",
    image: {
      src: '/images/landing-pages/sxsw-2026/macbook-neo.png',
      alt: 'MacBook Neo in four colors',
      width: 500,
      height: 333,
    },
    ctas: [
      {
        label: 'Get started',
        href: '#how-to-enter',
        variant: 'primary',
      },
    ],
  },
  sections: [
    {
      type: 'single-column',
      title: 'Conference talk',
      description: 'DASH 2026',
      children: (
        <div className="flex flex-col items-center gap-6">
          {speaker?.author_image_url && (
            <Image
              src={speaker.author_image_url}
              alt={speaker.author}
              width={192}
              height={192}
              className="rounded-full object-cover aspect-square w-48 h-48"
            />
          )}
          <div className="flex flex-col items-center gap-0">
            <p className="text-foreground-light font-medium">
              {speaker?.author}
              {speaker?.position && `, ${speaker.position}`}
            </p>
            <p className="text-foreground-lighter text-sm">Supabase</p>
          </div>
          <Button asChild type="default" size="medium">
            <Link
              href="https://supabase.link/dash-2026-slides"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download slides
            </Link>
          </Button>
        </div>
      ),
    },
    {
      type: 'single-column',
      id: 'how-to-enter',
      title: 'How to enter',
      children: (
        <div className="flex flex-col items-center gap-6">
          <ol className="flex flex-col gap-4 text-foreground-light text-lg list-decimal list-inside">
            <li>Visit the Supabase booth at DASH 2026 and get scanned</li>
            <li>
              Create a Supabase account with the same email address where you got our post-event
              note
            </li>
            <li>Load data into a Supabase database</li>
            <li>Complete these steps by the deadline in your post-event note</li>
          </ol>
          <Button asChild type="default" size="medium">
            <Link href="https://supabase.com/dashboard">Create your account</Link>
          </Button>
          <p className="text-xs text-foreground-lighter mt-4">
            No purchase necessary. Void where prohibited.{' '}
            <Link href="/go/contest-rules" className="underline">
              Official rules
            </Link>
            .
          </p>
        </div>
      ),
    },
  ],
}

export default page
