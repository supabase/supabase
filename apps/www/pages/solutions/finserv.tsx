import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'

import Layout from 'components/Layouts/Default'
import ProductHeader from 'components/Sections/ProductHeader2'
import SolutionsStickyNav from 'components/SolutionsStickyNav'

import getContent from 'data/solutions/finserv'
import { Solutions } from 'data/Solutions'

const WhySupabase = dynamic(() => import('components/Solutions/FeaturesSection'))
const SingleQuote = dynamic(() => import('components/Sections/SingleQuote'))
const PlatformSection = dynamic(() => import('components/Solutions/PlatformSection'))
const DXSection = dynamic(() => import('components/Solutions/DeveloperExperienceSection'))
const ResultsSection = dynamic(() => import('components/Solutions/ResultsSection'))
const FeatureGrid = dynamic(() => import('components/Solutions/FeatureGrid'))
const Security = dynamic(() => import('components/Enterprise/Security'))
const PlatformStarterSection = dynamic(() => import('components/Solutions/TwoColumnsSection'))
const CustomerEvidenceSection = dynamic(
  () => import('components/Solutions/CustomerEvidenceSection')
)

const FinServPage: NextPage = () => {
  const content = getContent()

  return (
    <>
      <NextSeo
        title={content.metadata.metaTitle}
        description={content.metadata.metaDescription}
        openGraph={{
          title: content.metadata.metaTitle,
          description: content.metadata.metaDescription,
          url: `https://supabase.com/solutions/finserv`,
        }}
      />
      <Layout className="overflow-visible">
        <SolutionsStickyNav activeItem={Solutions.finserv} type="app-type" />
        <ProductHeader
          {...content.heroSection}
          className="[&_h1]:2xl:!text-5xl bg-default border-0 lg:pb-8 [&_.ph-footer]:mt-0 [&_.ph-footer]:lg:mt-16 [&_.ph-footer]:xl:mt-32"
          sectionContainerClassName="lg:gap-4"
        />
        <SingleQuote
          id={content.singleQuote.id}
          quote={{
            text: content.singleQuote.quote.text,
            author: content.singleQuote.quote.author,
            role: content.singleQuote.quote.role,
            link: content.singleQuote.quote.link,
            logo: content.singleQuote.quote.logo,
          }}
          className="!pb-8 md:!pb-12 [&_q]:max-w-2xl"
        />
        <WhySupabase {...content.why} />
        <PlatformSection {...content.platform} />
        <DXSection
          id={content.developerExperience.id}
          title={content.developerExperience.title}
          subheading={content.developerExperience.subheading}
          features={content.developerExperience.features}
          className={content.developerExperience.className}
        />
        <ResultsSection
          id={content.resultsSection.id}
          heading={content.resultsSection.heading}
          subheading={content.resultsSection.subheading}
          highlights={content.resultsSection.highlights}
        />
        <FeatureGrid id={content.featureGrid.id} features={content.featureGrid.features} />
        <Security
          id={content.securitySection.id}
          label={content.securitySection.label}
          heading={content.securitySection.heading}
          subheading={content.securitySection.subheading}
          features={content.securitySection.features}
          cta={content.securitySection.cta}
        />
        <PlatformStarterSection {...content.platformStarterSection} />
        <CustomerEvidenceSection {...content.customerEvidence} />
      </Layout>
    </>
  )
}

export default FinServPage
