import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'

import Layout from 'components/Layouts/Default'
import ProductHeader from 'components/Sections/ProductHeader2'

import { data as content } from 'data/open-source/contributing/supasquad'
import { Separator } from 'ui'

const WhySupaSquad = dynamic(() => import('components/Supasquad/FeaturesSection'))
const FeaturedSection = dynamic(() => import('components/Supasquad/FeaturesSection'))
const PerfectTiming = dynamic(() => import('components/Supasquad/PerfectTiming'))
const Benefits = dynamic(() => import('components/Supasquad/FeaturesSection'))
const ApplicationFormSection = dynamic(() => import('components/Supasquad/ApplicationFormSection'))

const BeginnersPage: NextPage = () => {
  return (
    <>
      <NextSeo
        title={content.metadata.metaTitle}
        description={content.metadata.metaDescription}
        openGraph={{
          title: content.metadata.metaTitle,
          description: content.metadata.metaDescription,
          url: `https://supabase.com/solutions/beginners`,
        }}
      />
      <Layout className="overflow-visible">
        <ProductHeader
          {...content.heroSection}
          className="[&_h1]:2xl:!text-5xl bg-default border-0 lg:pb-8 [&_.ph-footer]:mt-0 [&_.ph-footer]:lg:mt-16 [&_.ph-footer]:xl:mt-32"
          sectionContainerClassName="lg:gap-4"
        />
        {/* <Quotes {...content.quotes} /> */}
        <Separator />
        <WhySupaSquad {...content.why} />
        <Separator />
        <FeaturedSection {...content.featured} />
        <Separator />
        <PerfectTiming
          id={content.timing.id}
          heading={content.timing.heading}
          subheading={content.timing.subheading}
          highlights={content.timing.highlights}
        />
        <Benefits className="md:mt-24" {...content.benefits} />
        <ApplicationFormSection
          id={content.ctaSection.id}
          title={content.ctaSection.title}
          cta={content.ctaSection.primaryCta}
        />
      </Layout>
    </>
  )
}

export default BeginnersPage
