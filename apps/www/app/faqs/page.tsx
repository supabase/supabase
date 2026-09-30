import DefaultLayout from '~/components/Layouts/Default'
import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import type { Metadata } from 'next'
import Link from 'next/link'

import { SITE_ORIGIN } from '@/lib/constants'
import { getAllFaqs } from '@/lib/faqs'
import { mdAlternates } from '@/lib/md-alternates'

const DESCRIPTION = 'Answers to common questions about using Postgres on Supabase.'

export const metadata: Metadata = {
  title: 'FAQs | Supabase',
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_ORIGIN}/faqs`, ...mdAlternates('faqs') },
  openGraph: {
    title: 'FAQs | Supabase',
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/faqs`,
  },
}

export default function FaqsIndexPage() {
  const faqs = getAllFaqs()

  return (
    <DefaultLayout>
      <SectionContainerWithCn className="max-w-3xl">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <h1 className="text-foreground text-3xl sm:text-4xl">FAQs</h1>
            <p className="text-foreground-lighter">{DESCRIPTION}</p>
          </div>
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {faqs.map((faq) => (
              <li key={faq.slug}>
                <Link
                  href={`/faqs/${faq.slug}`}
                  className="flex flex-col gap-1 py-5 group hover:bg-surface-75 transition-colors"
                >
                  <span className="text-foreground group-hover:underline">{faq.title}</span>
                  <span className="text-foreground-lighter text-sm">{faq.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </SectionContainerWithCn>
    </DefaultLayout>
  )
}
