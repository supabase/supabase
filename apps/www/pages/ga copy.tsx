import React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'

import { data } from '../data/ga'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '../components/Layouts/SectionContainer'

const FeaturesSection = dynamic(() => import('~/components/Sections/FeaturesSection'))
const CTABanner = dynamic(() => import('~/components/CTABanner'))

export default function IndexPage() {
  const router = useRouter()

  const meta_title = 'General Availability | Supabase'
  const meta_description =
    'Explore Supabase fees and pricing information. Find our competitive pricing plans, with no hidden pricing. We have a generous free plan for those getting started, and Pay As You Go for those scaling up.'

  return (
    <DefaultLayout>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/${router.pathname}`,
          images: [
            {
              url: `https://supabase.com/images/og/og-image-v2.jpg`,
            },
          ],
        }}
      />
      <div className="bg-alternative">
        <SectionContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <h1 className="h1 !mb-1">{data.hero.title}</h1>
            <p className="mb-4 text-2xl text-foreground-light">{data.hero.paragraph}</p>
            <p className="text-foreground-lighter text-sm">Published: {data.hero.publishedAt}</p>
          </div>
          <div className="w-full">
            <ol className="w-full md:pl-4 lg:pl-8 md:border-l gap-4 columns-2 text-foreground-light">
              {data.hero.sections.map((section, i) => (
                <li key={section.title}>
                  <Link
                    href={section.link}
                    className="p-1 inline-flex hover:text-foreground font-mono text-sm gap-4"
                  >
                    <span className="w-3 text-right">
                      {i < 9 && '0'}
                      {i + 1}
                    </span>
                    <span>{section.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </SectionContainer>
      </div>
      <FeaturesSection {...data.introSection} />
      <FeaturesSection {...data.highlightsSection} />
      <CTABanner />
    </DefaultLayout>
  )
}
