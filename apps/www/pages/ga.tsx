import React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'

import { data as pageData } from '../data/ga'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '../components/Layouts/SectionContainer'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'
import ImageGrid from '../components/ImageGrid'
import CompaniesData from 'data/Companies'
import { useTheme } from 'next-themes'

const ParagraphSection = dynamic(() => import('~/components/Sections/ParagraphSection'))
const FeaturesSection = dynamic(() => import('~/components/Sections/FeaturesSection'))
const CTABanner = dynamic(() => import('~/components/CTABanner'))

export default function IndexPage() {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme?.includes('dark')
  const data = pageData(isDark!)

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
        <SectionContainer className="flex flex-col gap-6 lg:gap-12">
          <Image
            src="/images/launchweek/ga/ga-black.svg"
            alt="GA logo"
            className="dark:hidden w-12 md:w-16 aspect-[104/57] h-auto"
            priority
            quality={100}
            width={300}
            height={300}
          />
          <Image
            src="/images/launchweek/ga/ga-white.svg"
            alt="GA logo"
            className="hidden dark:block w-12 md:w-16 aspect-[104/57] h-auto"
            priority
            quality={100}
            width={300}
            height={300}
          />
          <div>
            <h1 className="text-3xl md:text-5xl xl:text-8xl lg:max-w-xl xl:max-w-7xl tracking-[-1.1px] text-foreground-light font-normal">
              {/* {data.hero.title} */}
              We are moving to
              <br />
              <span className="text-foreground">General Availability</span>
            </h1>
          </div>
          {data.hero?.publishedAt && (
            <span className="text-sm text-foreground-lighter font-mono md:text-base">
              {data.hero.publishedAt}
            </span>
          )}
        </SectionContainer>
        <SectionContainer className="!pt-0">
          {data.highlightsSection.highlights && (
            <div
              className="flex-wrap md:flex-nowrap w-fit md:w-full md:flex md:items-start grid lg:grid-cols-4 gap-4 md:gap-10 lg:gap-20
            "
            >
              {data.highlightsSection.highlights.map(
                (highlight: { number: string; text: string }, i: number) => {
                  return (
                    <div key={i} className="">
                      <div className="border-t-[1px] border-brand-500 w-[32px]"></div>
                      <h2 className="text-xl md:text-2xl lg:text-4xl pt-1.5 lg:pt-3 tracking-[-1.5px] font-mono">
                        {highlight.number}
                      </h2>
                      <ReactMarkdown className="text-foreground-light text-sm lg:text-base lg:mt-3">
                        {highlight.text}
                      </ReactMarkdown>
                    </div>
                  )
                }
              )}
            </div>
          )}
          <div className="w-full border-t max-w-4xl mt-12 lg:mt-32 flex justify-center">
            <ol className="w-full pt-8 gap-4 columns-2 lg:columns-3 text-foreground-light">
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
      <ParagraphSection {...data.openSourceSection} hasStickyTitle />
      <SectionContainer className="!pt-0">
        {data.communityStats.highlights && (
          <div className="grid grid-cols-2 md:grid md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-5 md:gap-10 lg:gap-20">
            {data.communityStats.highlights.map(
              (highlight: { number: string; text: string }, i: number) => {
                return (
                  <div key={i} className="">
                    <div className="border-t-[1px] border-brand-500 w-[32px]"></div>
                    <h2 className="text-xl md:text-2xl lg:text-4xl pt-1.5 lg:pt-3 tracking-[-1.5px] font-mono">
                      {highlight.number}
                    </h2>
                    <ReactMarkdown className="text-foreground-light text-sm lg:text-base lg:mt-3">
                      {highlight.text}
                    </ReactMarkdown>
                  </div>
                )
              }
            )}
          </div>
        )}
      </SectionContainer>
      <SectionContainer className="!py-0 border-b" children={null} />
      <ParagraphSection {...data.scaleSection} hasStickyTitle />
      <SectionContainer className="!py-0 border-b" children={null} />
      <ParagraphSection {...data.enterpriseSection} hasStickyTitle className="!pb-8 lg:!pb-16" />
      <SectionContainer className="!pt-0 !grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 xl:gap-10">
        <div className="col-span-full lg:col-start-6 lg:col-span-7">
          <ImageGrid
            smCols={3}
            mdCols={3}
            lgCols={3}
            images={data.enterpriseSection.companies}
            removeFilter
          />
        </div>
      </SectionContainer>
      <SectionContainer className="!py-0 border-b" children={null} />
      <ParagraphSection {...data.integrationsSection} hasStickyTitle className="!pb-8 lg:!pb-16" />
      <SectionContainer className="!pt-0 !grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 xl:gap-10">
        <div className="col-span-full lg:col-start-6 lg:col-span-7">
          <ImageGrid
            smCols={3}
            mdCols={3}
            lgCols={3}
            images={data.integrationsSection.partners}
            removeFilter
          />
        </div>
      </SectionContainer>
      <SectionContainer className="!py-0 border-b" children={null} />
      <ParagraphSection {...data['whats-new']} hasStickyTitle />
      <SectionContainer className="!py-0 border-b" children={null} />
      <ParagraphSection {...data['whats-next']} hasStickyTitle />
      <CTABanner />
    </DefaultLayout>
  )
}
