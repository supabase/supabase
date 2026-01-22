import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'

import Layout from 'components/Layouts/Default'
import SolutionsStickyNav from 'components/SolutionsStickyNav'
import SectionContainer from 'components/Layouts/SectionContainer'
import content from 'data/solutions/innovation-teams'
import { Solutions } from 'data/Solutions'
import { cn } from 'ui'

const ProductHeader = dynamic(() => import('components/Sections/ProductHeader2'))
const SingleQuote = dynamic(() => import('components/Sections/SingleQuote'))
const FeaturesSection = dynamic(() => import('components/Solutions/FeaturesSection'))
const PlatformSection = dynamic(() => import('components/Solutions/PlatformSection'))
const DXSection = dynamic(() => import('components/Solutions/DeveloperExperienceSection'))
const ResultsSection = dynamic(() => import('components/Solutions/ResultsSection'))
const FeatureGrid = dynamic(() => import('components/Solutions/FeatureGrid'))
const PlatformStarterSection = dynamic(() => import('components/Solutions/TwoColumnsSection'))
const MPCSection = dynamic(() => import('components/Solutions/MPCSection'))
const SecuritySection = dynamic(() => import('components/Enterprise/Security'))

const InnovationTeams: NextPage = () => {
  const data = (content as any)()
  return (
    <>
      <NextSeo
        title={data.metadata.metaTitle}
        description={data.metadata.metaDescription}
        openGraph={{
          title: data.metadata.metaTitle,
          description: data.metadata.metaDescription,
          url: `https://supabase.com/solutions/innovation-teams`,
        }}
        noindex={true}
        nofollow={true}
      />
      <Layout className="overflow-visible">
        <SolutionsStickyNav activeItem={Solutions.innovationTeams} type="use-case" />
        <ProductHeader {...data.heroSection} />
        {data.quote && (
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
        )}
        {data.secondaryQuote && (
          <SingleQuote
            id="secondary-quote"
            quote={{
              text: data.secondaryQuote.text,
              author: data.secondaryQuote.author,
              role: data.secondaryQuote.role,
              logo: data.secondaryQuote.logo,
            }}
            className="!pt-0"
          />
        )}
        {/* AI Builder Ecosystem Section */}
        {data.aiBuilderEcosystem && (
          <SectionContainer id={data.aiBuilderEcosystem.id} className="py-16 md:py-24">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl text-foreground-lighter mb-4">
                {data.aiBuilderEcosystem.heading}
              </h2>
              <p className="text-foreground-lighter text-lg">
                {data.aiBuilderEcosystem.subheading}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {data.aiBuilderEcosystem.builders.map(
                (builder: { name: string; description: string }) => (
                  <div
                    key={builder.name}
                    className="text-center p-6 rounded-lg border bg-surface-75"
                  >
                    <h3 className="text-foreground font-medium mb-2">{builder.name}</h3>
                    <p className="text-foreground-lighter text-sm">{builder.description}</p>
                  </div>
                )
              )}
            </div>
            <p className="text-center text-foreground-lighter mt-8">
              No configuration. No complexity. It just works.
            </p>
          </SectionContainer>
        )}
        <FeaturesSection
          id={data.why.id}
          label={data.why.label}
          heading={data.why.heading}
          subheading={data.why.subheading}
          features={data.why.features}
        />
        {/* Customer Evidence Section */}
        {data.customerEvidence && (
          <SectionContainer id={data.customerEvidence.id} className="py-16 md:py-24">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl text-foreground-lighter">
                {data.customerEvidence.heading}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {data.customerEvidence.customers.map(
                (customer: {
                  name: string
                  highlights: string[]
                  cta?: { label: string; href: string }
                }) => (
                  <div key={customer.name} className="p-8 rounded-lg border bg-surface-75">
                    <h3 className="text-xl text-foreground font-medium mb-4">{customer.name}</h3>
                    <ul className="space-y-3 mb-6">
                      {customer.highlights.map((highlight: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-foreground-lighter">
                          <Check className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    {customer.cta && (
                      <Link
                        href={customer.cta.href}
                        className="inline-flex items-center gap-2 text-brand hover:text-brand-600 transition-colors"
                      >
                        {customer.cta.label}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                )
              )}
            </div>
          </SectionContainer>
        )}
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
        {/* Security Section */}
        {data.securitySection && (
          <SecuritySection
            id={data.securitySection.id}
            label={data.securitySection.label}
            heading={data.securitySection.heading}
            subheading={data.securitySection.subheading}
            features={data.securitySection.features}
            cta={data.securitySection.cta}
          />
        )}
        {/* Innovation Enablement Section */}
        {data.innovationEnablement && (
          <SectionContainer id={data.innovationEnablement.id} className="py-16 md:py-24">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl text-foreground-lighter mb-4">
                {data.innovationEnablement.heading}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {data.innovationEnablement.options.map(
                (option: {
                  title: string
                  type: string
                  description: string
                  cta: { label: string; href: string }
                }) => (
                  <div
                    key={option.title}
                    className="p-6 rounded-lg border bg-surface-75 flex flex-col"
                  >
                    <span className="text-xs uppercase tracking-wider text-foreground-lighter mb-2">
                      {option.type}
                    </span>
                    <h3 className="text-lg text-foreground font-medium mb-3">{option.title}</h3>
                    <p className="text-foreground-lighter text-sm mb-6 flex-grow">
                      {option.description}
                    </p>
                    <Link
                      href={option.cta.href}
                      className={cn(
                        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        option.type === 'Self-Serve'
                          ? 'bg-brand text-white hover:bg-brand-600'
                          : 'border border-foreground-muted text-foreground hover:bg-surface-200'
                      )}
                    >
                      {option.cta.label}
                    </Link>
                  </div>
                )
              )}
            </div>
          </SectionContainer>
        )}
        {data.platformStarterSection && <PlatformStarterSection {...data.platformStarterSection} />}
        {data.mcp && <MPCSection {...data.mcp} />}
      </Layout>
    </>
  )
}

export default InnovationTeams
