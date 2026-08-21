import Layout from 'components/Layouts/Default'
import ProductHeader from 'components/Sections/ProductHeader2'
import SolutionsStickyNav from 'components/SolutionsStickyNav'
import { Solutions } from 'data/Solutions'
import getContent from 'data/solutions/hosted-postgres'
import { NextPage } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'

const WhySupabase = dynamic(() => import('components/Solutions/FeaturesSection'))
const PricingComparison = dynamic(() => import('components/Solutions/PricingComparisonSection'))
const FeatureGrid = dynamic(() => import('components/Solutions/FeatureGrid'))
const ResultsSection = dynamic(() => import('components/Solutions/ResultsSection'))
const Security = dynamic(() => import('components/Enterprise/Security'))
const CtaSection = dynamic(() => import('components/Solutions/CtaSection'))
const PlatformStarterSection = dynamic(() => import('components/Solutions/TwoColumnsSection'))
const MPCSection = dynamic(() => import('components/Solutions/MPCSection'))

const HostedPostgresPage: NextPage = () => {
  const content = getContent()

  return (
    <>
      <NextSeo
        title={content.metadata.metaTitle}
        description={content.metadata.metaDescription}
        openGraph={{
          title: content.metadata.metaTitle,
          description: content.metadata.metaDescription,
          url: `https://supabase.com/solutions/hosted-postgres`,
        }}
      />
      <Layout className="overflow-visible">
        <SolutionsStickyNav activeItem={Solutions.hostedPostgres} type="app-type" />
        <ProductHeader
          {...content.heroSection}
          className="[&_h1]:2xl:text-5xl! bg-default border-0 lg:pb-8 [&_.ph-footer]:mt-0 [&_.ph-footer]:lg:mt-16 [&_.ph-footer]:xl:mt-24"
          sectionContainerClassName="lg:gap-4"
        />
        <WhySupabase {...content.why} />
        <PricingComparison {...content.pricing} />
        <FeatureGrid {...content.included} />
        <FeatureGrid {...content.bundled} />
        <ResultsSection
          id={content.resultsSection.id}
          heading={content.resultsSection.heading}
          subheading={content.resultsSection.subheading}
          highlights={content.resultsSection.highlights}
        />
        <FeatureGrid {...content.performanceGrid} />
        <Security
          id={content.securitySection.id}
          label={content.securitySection.label}
          heading={content.securitySection.heading}
          subheading={content.securitySection.subheading}
          features={content.securitySection.features}
          cta={content.securitySection.cta}
        />
        <CtaSection {...content.platformUpsell} />
        <PlatformStarterSection {...content.platformStarterSection} />
        <MPCSection {...content.mcp} />
      </Layout>
    </>
  )
}

export default HostedPostgresPage
