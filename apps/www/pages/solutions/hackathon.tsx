import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'

import Layout from 'components/Layouts/Default'
import SolutionsStickyNav from 'components/SolutionsStickyNav'
import content from 'data/solutions/hackathon'
import { Solutions } from 'data/Solutions'

const ProductHeader = dynamic(() => import('components/Sections/ProductHeader2'))
const SingleQuote = dynamic(() => import('components/Sections/SingleQuote'))
const FeaturesSection = dynamic(() => import('components/Solutions/FeaturesSection'))
const PlatformSection = dynamic(() => import('components/Solutions/PlatformSection'))
const DXSection = dynamic(() => import('components/Solutions/DeveloperExperienceSection'))
const ResultsSection = dynamic(() => import('components/Solutions/ResultsSection'))
const FeatureGrid = dynamic(() => import('components/Solutions/FeatureGrid'))
const PlatformStarterSection = dynamic(() => import('components/Solutions/TwoColumnsSection'))
const MPCSection = dynamic(() => import('components/Solutions/MPCSection'))

const Hackathon: NextPage = () => {
  const data = (content as any)()
  return (
    <>
      <NextSeo
        title={data.metadata.metaTitle}
        description={data.metadata.metaDescription}
        openGraph={{
          title: data.metadata.metaTitle,
          description: data.metadata.metaDescription,
          url: `https://supabase.com/solutions/hackathon`,
        }}
        noindex={true}
        nofollow={true}
      />
      <Layout className="overflow-visible">
        <SolutionsStickyNav activeItem={Solutions.hackathon} type="use-case" />
        <ProductHeader {...data.heroSection} />
        <SingleQuote
          quote={{
            text: data.quote.text,
            author: data.quote.author,
            role: data.quote.role,
            logo: data.quote.logo,
            link: data.quote.link,
            avatar: data.quote.avatar,
          }}
          {...data.quote}
        />
        <FeaturesSection
          id={data.why.id}
          label={data.why.label}
          heading={data.why.heading}
          subheading={data.why.subheading}
          features={data.why.features}
        />
        <PlatformSection
          id={data.platform.id}
          title={data.platform.title}
          subheading={data.platform.subheading}
          features={data.platform.features}
        />
        <DXSection
          id={data.developerExperience.id}
          title={data.developerExperience.title}
          subheading={data.developerExperience.subheading}
          features={data.developerExperience.features}
          className={data.developerExperience.className}
        />
        {data.resultsSection && (
          <ResultsSection
            id={data.resultsSection.id}
            heading={data.resultsSection.heading}
            subheading={data.resultsSection.subheading}
            highlights={data.resultsSection.highlights}
          />
        )}
        {data.featureGrid && (
          <FeatureGrid id={data.featureGrid.id} features={data.featureGrid.features} />
        )}
        {data.platformStarterSection && <PlatformStarterSection {...data.platformStarterSection} />}
        {data.mcp && <MPCSection {...data.mcp} />}
      </Layout>
    </>
  )
}

export default Hackathon
