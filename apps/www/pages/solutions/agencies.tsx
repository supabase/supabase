import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'

import Layout from 'components/Layouts/Default'
import ProductHeader from 'components/Sections/ProductHeader2'
import SolutionsStickyNav from 'components/SolutionsStickyNav'

import content from 'data/solutions/agencies'
import { Solutions } from 'data/Solutions'

const Quotes = dynamic(() => import('components/Solutions/Quotes'))
const FeaturesSection = dynamic(() => import('components/Solutions/FeaturesSection'))
const PlatformSection = dynamic(() => import('components/Solutions/PlatformSection'))
const DXSection = dynamic(() => import('components/Solutions/DeveloperExperienceSection'))
const ResultsSection = dynamic(() => import('components/Solutions/ResultsSection'))
const SecuritySection = dynamic(() => import('components/Enterprise/Security'))
const PlatformStarterSection = dynamic(() => import('components/Solutions/TwoColumnsSection'))
const MPCSection = dynamic(() => import('components/Solutions/MPCSection'))
const CTAForm = dynamic(() => import('components/Enterprise/CTAForm'))

const Agencies: NextPage = () => (
  <>
    <NextSeo
      title={content.metadata.metaTitle}
      description={content.metadata.metaDescription}
      openGraph={{
        title: content.metadata.metaTitle,
        description: content.metadata.metaDescription,
        url: 'https://supabase.com/solutions/agencies',
      }}
    />
    <Layout className="overflow-visible">
      <SolutionsStickyNav activeItem={Solutions.agencies} type="use-case" />
      <ProductHeader
        {...content.heroSection}
        className="[&_h1]:2xl:!text-5xl bg-default border-0 lg:pb-8 [&_.ph-footer]:mt-0 [&_.ph-footer]:lg:mt-16 [&_.ph-footer]:xl:mt-32"
        sectionContainerClassName="lg:gap-4"
      />
      <Quotes {...content.quotes} />
      <FeaturesSection {...content.why} />
      <PlatformSection {...content.platform} />
      <DXSection {...content.developerExperience} />
      <ResultsSection {...content.resultsSection} />
      <SecuritySection {...content.securitySection} />
      <FeaturesSection {...content.partnerships} />
      <PlatformStarterSection {...content.platformStarterSection} />
      <MPCSection {...content.mcp} />
      <div id="request-demo">
        <CTAForm />
      </div>
    </Layout>
  </>
)

export default Agencies
