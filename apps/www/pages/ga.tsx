import React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'

import { data } from '../data/ga'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '../components/Layouts/SectionContainer'
import ReactMarkdown from 'react-markdown'

const ParagraphSection = dynamic(() => import('~/components/Sections/ParagraphSection'))
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
      <div className="bg-alternative border-b border-muted">
        <SectionContainer className="text-center space-y-4 !pb-0">
          <p className="text-sm text-brand md:text-base">{data.hero.publishedAt}</p>
          <h1 className="text-3xl md:text-4xl xl:text-5xl lg:max-w-2xl xl:max-w-3xl lg:mx-auto tracking-[-1.1px]">
            {data.hero.title}
          </h1>
          <p className="text-sm md:text-base text-foreground-lighter max-w-sm sm:max-w-md md:max-w-lg mx-auto">
            {data.hero.paragraph}
          </p>
        </SectionContainer>
        <SectionContainer>
          <div className="flex flex-wrap md:flex-nowrap -mt-6 md:mt-0 w-fit md:w-full mx-auto md:flex md:items-start justify-around lg:w-full lg:max-w-5xl">
            {data.highlightsSection.highlights.map(
              (highlight: { number: string; text: string }, i: number) => {
                return (
                  <div
                    key={i}
                    className="border-t-[1px] mt-6 mx-2 md:mx-2 md:mt-0 md:border-0 border-brand w-[134px] md:max-w-none"
                  >
                    <div className="hidden md:block border-t-[1px] lg:border-t-2 border-brand w-[60px] lg:w-[100px]"></div>
                    <h2 className="text-3xl lg:text-4xl pt-3 tracking-[-1.5px]">
                      {highlight.number}
                    </h2>
                    <ReactMarkdown className="text-foreground-light text-sm lg:text-base">
                      {highlight.text}
                    </ReactMarkdown>
                  </div>
                )
              }
            )}
          </div>
          <div className="w-full max-w-2xl mx-auto mt-16 lg:mt-24">
            <ol className="w-full md:pt-4 lg:pt-8 md:border-t gap-4 columns-2 lg:columns-3 text-foreground-light">
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
      <ParagraphSection {...data.companySection} hasStickyTitle />
      <SectionContainer className="!py-0 border-b" children={null} />
      <FeaturesSection {...data.principlesSection} hasStickyTitle />
      <SectionContainer className="!py-0 border-b" children={null} />
      <ParagraphSection {...data.securitySection} hasStickyTitle />
      <SectionContainer className="!py-0 border-b" children={null} />
      <ParagraphSection {...data.performanceSection} hasStickyTitle />
      <SectionContainer className="!py-0 border-b" children={null} />
      <ParagraphSection {...data.reliabilitySection} hasStickyTitle />
      <SectionContainer className="!py-0 border-b" children={null} />
      <ParagraphSection {...data.integrationsSection} hasStickyTitle />
      <SectionContainer className="!py-0 border-b" children={null} />
      <ParagraphSection {...data.openSourceSection} hasStickyTitle />
      <SectionContainer className="!py-0 border-b" children={null} />
      <ParagraphSection {...data.communitySection} hasStickyTitle />
      <SectionContainer className="!py-0 border-b" children={null} />
      <ParagraphSection {...data.pricingSection} hasStickyTitle />
      <SectionContainer className="!py-0 border-b" children={null} />
      <ParagraphSection {...data.enterpriseSection} hasStickyTitle />
      <SectionContainer className="!py-0 border-b" children={null} />
      <ParagraphSection {...data.fundingSection} hasStickyTitle />
      <SectionContainer className="!py-0 border-b" children={null} />
      <ParagraphSection {...data.missionSection} hasStickyTitle />
      <CTABanner />
    </DefaultLayout>
  )
}
