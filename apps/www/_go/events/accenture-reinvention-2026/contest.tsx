import type { GoPageInput } from 'marketing'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from 'ui'

import authors from '@/lib/authors.json'

const speaker = authors.find((a) => a.author_id === 'pedro_rodrigues')

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'accenture-reinvention-2026/contest',
  metadata: {
    title:
      'Win an iPhone 17 Pro Max | Supabase at Accenture AI & Data Conference (ReinventionX) 2026',
    description:
      'Create a Supabase account and load data for a chance to win an iPhone 17 Pro Max. Accenture AI & Data Conference (ReinventionX) 2026.',
  },
  hero: {
    title: 'Win an iPhone 17 Pro Max',
    subtitle: 'Supabase at Accenture AI & Data Conference 2026',
    description:
      'Your team is already building with AI tools. Supabase is the production backend that turns those prototypes into secure, scalable applications. Try it out -- create an account, load some data, and you could win an iPhone 17 Pro Max.',
    image: {
      src: '/images/landing-pages/stripe-sessions/iphone17-pro-max.png',
      alt: 'Orange iPhone 17 Pro Max',
      width: 400,
      height: 500,
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
      title: 'What AI-Native Companies Figured Out About Infrastructure',
      children: (
        <div className="flex flex-col items-center gap-8">
          {speaker && (
            <div className="flex flex-col items-center gap-4">
              {speaker.author_image_url && (
                <Image
                  src={speaker.author_image_url}
                  alt={speaker.author}
                  width={192}
                  height={192}
                  className="rounded-full object-cover aspect-square w-48 h-48"
                />
              )}
              <div className="flex flex-col items-center gap-0">
                <p className="text-foreground-light font-medium text-center">
                  {speaker.author}
                  {speaker.position && `, ${speaker.position}`}
                </p>
                <p className="text-foreground-lighter text-sm text-center">Supabase</p>
              </div>
            </div>
          )}
          <p className="text-foreground-light text-lg text-center">
            Enterprise AI initiatives stall not because of the models, but because of the
            infrastructure underneath. While enterprises spend months provisioning backends for each
            AI project, AI native companies do it in seconds for millions of users. This session
            examines the infrastructure pattern that makes this possible and shows how enterprises
            can adopt it to accelerate AI initiatives, enable agentic workflows safely, and build AI
            native products for their teams and customers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild type="primary" size="medium">
              <Link
                href="https://supabase.com/docs/guides/getting-started/ai-skills"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn about Supabase AI Tools
              </Link>
            </Button>
            <Button asChild type="default" size="medium">
              <Link
                href="https://supabase.link/accenture-reinvention-2026-slides"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Slides
              </Link>
            </Button>
          </div>
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
            <li>Create a Supabase account with the same email where you got our post-event note</li>
            <li>Load data into a Supabase database</li>
            <li>Complete these steps by Monday, May 4, 2026 at 12:00 PM PST</li>
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
