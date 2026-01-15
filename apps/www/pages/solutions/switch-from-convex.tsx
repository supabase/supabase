import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import Layout from 'components/Layouts/Default'
import SectionContainer from 'components/Layouts/SectionContainer'
import SolutionsStickyNav from 'components/SolutionsStickyNav'
import content from 'data/solutions/convex'
import { Solutions } from 'data/Solutions'

const ProductHeader = dynamic(() => import('components/Sections/ProductHeader2'))
const FeaturesSection = dynamic(() => import('components/Solutions/FeaturesSection'))
const PlatformSection = dynamic(() => import('components/Solutions/PlatformSection'))
const DXSection = dynamic(() => import('components/Solutions/DeveloperExperienceSection'))
const ResultsSection = dynamic(() => import('components/Solutions/ResultsSection'))
const FeatureGrid = dynamic(() => import('components/Solutions/FeatureGrid'))
const Security = dynamic(() => import('components/Enterprise/Security'))
const CtaSection = dynamic(() => import('components/Solutions/CtaSection'))

const Convex: NextPage = () => {
  return (
    <>
      <NextSeo
        title={content.metadata.metaTitle}
        description={content.metadata.metaDescription}
        openGraph={{
          title: content.metadata.metaTitle,
          description: content.metadata.metaDescription,
          url: `https://supabase.com/solutions/switch-from-convex`,
        }}
        noindex={true}
        nofollow={true}
      />
      <Layout className="overflow-visible">
        <SolutionsStickyNav activeItem={Solutions.convex} type="migration" />
        <ProductHeader {...content.heroSection} />

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

        <SectionContainer id={content.uiSection.id} className="py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="lg:pr-10">
              <h2 className="h2 text-foreground-lighter max-w-sm">{content.uiSection.title}</h2>
              <p className="text-foreground-light mt-6">{content.uiSection.subheading}</p>
              <div className="mt-6">
                <Link
                  href={content.uiSection.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-foreground hover:text-brand transition-colors font-medium"
                >
                  Explore
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div>{content.uiSection.content}</div>
          </div>
        </SectionContainer>

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

export default Convex
