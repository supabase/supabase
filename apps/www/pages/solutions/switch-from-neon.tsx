import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'

import Layout from 'components/Layouts/Default'
import SolutionsStickyNav from 'components/SolutionsStickyNav'
import content from 'data/solutions/neon'
import { Solutions } from 'data/Solutions'

const ProductHeader = dynamic(() => import('components/Sections/ProductHeader2'))
const SingleQuote = dynamic(() => import('components/Sections/SingleQuote'))
const FeaturesSection = dynamic(() => import('components/Solutions/FeaturesSection'))
const PlatformSection = dynamic(() => import('components/Solutions/PlatformSection'))
const DXSection = dynamic(() => import('components/Solutions/DeveloperExperienceSection'))
const ResultsSection = dynamic(() => import('components/Solutions/ResultsSection'))
const FeatureGrid = dynamic(() => import('components/Solutions/FeatureGrid'))
const Security = dynamic(() => import('components/Enterprise/Security'))
const CtaSection = dynamic(() => import('components/Solutions/CtaSection'))

const Neon: NextPage = () => {
  return (
    <>
      <NextSeo
        title={content.metadata.metaTitle}
        description={content.metadata.metaDescription}
        openGraph={{
          title: content.metadata.metaTitle,
          description: content.metadata.metaDescription,
          url: `https://supabase.com/solutions/switch-from-neon`,
        }}
        noindex={true}
        nofollow={true}
      />
      <Layout className="overflow-visible">
        <SolutionsStickyNav activeItem={Solutions.neon} type="migration" />
        <ProductHeader {...content.heroSection} />
        <SingleQuote
          quote={{
            text: content.quote.text,
            author: content.quote.author,
            role: content.quote.role,
            logo: content.quote.logo,
            link: content.quote.link,
            avatar: content.quote.avatar,
          }}
          {...content.quote}
        />
        <FeaturesSection
          id={content.why.id}
          label={content.why.label}
          heading={content.why.heading}
          subheading={content.why.subheading}
          features={content.why.features}
        />
        <PlatformSection
          id={content.platform.id}
          title={content.platform.title}
          subheading={content.platform.subheading}
          features={content.platform.features}
        />
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
        <CtaSection
          id={content.ctaSection.id}
          title={content.ctaSection.title}
          primaryCta={content.ctaSection.primaryCta}
        />
      </Layout>
    </>
  )
}

export default Neon
