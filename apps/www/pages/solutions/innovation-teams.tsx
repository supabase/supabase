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
import { Button, cn } from 'ui'

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Left column - Content */}
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl text-foreground-lighter mb-4">
                  {data.aiBuilderEcosystem.heading}
                </h2>
                <p className="text-foreground-lighter text-lg mb-8">
                  {data.aiBuilderEcosystem.subheading}
                </p>
                <ul className="space-y-4">
                  {data.aiBuilderEcosystem.builders.map(
                    (builder: { name: string; description: string }) => (
                      <li key={builder.name} className="flex gap-3">
                        <Check className="w-5 h-5 text-brand mt-0.5 shrink-0" />
                        <div>
                          <span className="text-foreground font-medium">{builder.name}</span>
                          <span className="text-foreground-lighter">: {builder.description}</span>
                        </div>
                      </li>
                    )
                  )}
                </ul>
                <p className="text-foreground-lighter mt-8">
                  No configuration. No complexity. It just works.
                </p>
              </div>

              {/* Right column - Visual */}
              <div className="hidden lg:flex flex-col items-center justify-center">
                {/* Supabase Logo */}
                <div className="w-24 h-24 rounded-full bg-surface-100 border border-strong flex items-center justify-center">
                  <img
                    src="/images/supabase-logo-icon.svg"
                    alt="Supabase"
                    className="w-12 h-12"
                    draggable={false}
                  />
                </div>

                {/* SVG Lines */}
                <svg className="w-[300px] h-[120px]" viewBox="0 0 300 120" fill="none">
                  <path
                    d="M 150 0 L 30 120"
                    stroke="hsl(var(--border-strong))"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    strokeOpacity="0.5"
                    fill="none"
                  />
                  <path
                    d="M 150 0 L 100 120"
                    stroke="hsl(var(--border-strong))"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    strokeOpacity="0.5"
                    fill="none"
                  />
                  <path
                    d="M 150 0 L 150 120"
                    stroke="hsl(var(--border-strong))"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M 150 0 L 200 120"
                    stroke="hsl(var(--border-strong))"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    strokeOpacity="0.5"
                    fill="none"
                  />
                  <path
                    d="M 150 0 L 270 120"
                    stroke="hsl(var(--border-strong))"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    strokeOpacity="0.5"
                    fill="none"
                  />
                </svg>

                {/* Provider Logos Bar */}
                <div className="flex items-center gap-6 px-6 py-4 rounded-lg border border-strong bg-surface-100">
                  <img
                    src="/images/logos/publicity/lovable.svg"
                    alt="Lovable"
                    className="h-8"
                    draggable={false}
                  />
                  <img
                    src="/images/logos/publicity/bolt.svg"
                    alt="Bolt"
                    className="h-8"
                    draggable={false}
                  />
                  <img
                    src="/images/logos/publicity/v0.svg"
                    alt="v0"
                    className="h-8"
                    draggable={false}
                  />
                  <img
                    src="/images/logos/publicity/figma.svg"
                    alt="Figma"
                    className="h-8"
                    draggable={false}
                  />
                  <img
                    src="/images/logos/publicity/tempo.svg"
                    alt="Tempo"
                    className="h-8"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
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
            <div className="grid md:grid-cols-2 gap-0 max-w-5xl mx-auto rounded-lg border overflow-hidden divide-x">
              {data.customerEvidence.customers.map(
                (customer: {
                  name: string
                  logo?: string
                  highlights: string[]
                  cta?: { label: string; href: string }
                }) => (
                  <div key={customer.name} className="p-6 md:p-8 flex flex-col">
                    {customer.logo && (
                      <div
                        className="h-8 w-28 mb-6"
                        style={{
                          maskImage: `url(${customer.logo})`,
                          WebkitMaskImage: `url(${customer.logo})`,
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          maskPosition: 'left center',
                          WebkitMaskPosition: 'left center',
                          backgroundColor: 'currentColor',
                        }}
                      />
                    )}
                    <h3 className="text-lg text-foreground font-medium mb-4">{customer.name}</h3>
                    <ul className="space-y-3 mb-6 flex-grow">
                      {customer.highlights.map((highlight: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-foreground-lighter text-sm"
                        >
                          <Check className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    {customer.cta && (
                      <Link
                        href={customer.cta.href}
                        className="inline-flex items-center gap-2 text-sm text-brand hover:text-brand-600 transition-colors"
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
            <div className="flex flex-col md:flex-row max-w-5xl mx-auto rounded-lg border overflow-hidden">
              {data.innovationEnablement.options.map(
                (
                  option: {
                    title: string
                    type: string
                    description: string
                    cta: { label: string; href: string }
                  },
                  index: number
                ) => (
                  <div key={option.title} className="flex-1 flex items-stretch">
                    <div className="p-6 md:p-8 flex flex-col flex-1">
                      <span className="text-xs uppercase tracking-wider text-foreground-muted mb-2">
                        {option.type}
                      </span>
                      <h3 className="text-lg text-foreground font-medium mb-2">{option.title}</h3>
                      <p className="text-foreground-lighter text-sm mb-6 flex-grow">
                        {option.description}
                      </p>
                      <Button type={index === 0 ? 'primary' : 'default'} asChild>
                        <Link href={option.cta.href}>{option.cta.label}</Link>
                      </Button>
                    </div>
                    {index < data.innovationEnablement.options.length - 1 && (
                      <div className="hidden md:flex items-center justify-center w-8 shrink-0">
                        <svg className="w-8 h-full" viewBox="0 0 32 100" fill="none">
                          <path
                            d="M 0 50 L 32 50"
                            stroke="hsl(var(--border-strong))"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                          />
                        </svg>
                      </div>
                    )}
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
