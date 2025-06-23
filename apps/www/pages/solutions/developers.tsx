import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'

import Layout from '~/components/Layouts/Default'
import ProductHeader from '~/components/Sections/ProductHeader2'
import getContent from '~/data/solutions/developers'
import Image from 'next/image'
import SingleQuote from '../../components/Sections/SingleQuote'

const WhySupabase = dynamic(() => import('~/components/Solutions/FeaturesSection'))
const PlatformSection = dynamic(() => import('~/components/Solutions/PlatformSection'))
const PlatformStarterSection = dynamic(
  () => import('~/components/Solutions/PlatformStarterSection')
)
const DXSection = dynamic(() => import('~/components/Solutions/DeveloperExperienceSection'))
const ResultsSection = dynamic(() => import('~/components/Solutions/ResultsSection'))
const FeatureGrid = dynamic(() => import('~/components/Solutions/FeatureGrid'))
const Security = dynamic(() => import('~/components/Enterprise/Security'))
const MPCSection = dynamic(() => import('~/components/Solutions/MPCSection'))

const BeginnersPage: NextPage = () => {
  const content = getContent()

  return (
    <>
      <NextSeo
        title={content.metadata.metaTitle}
        description={content.metadata.metaDescription}
        openGraph={{
          title: content.metadata.metaTitle,
          description: content.metadata.metaDescription,
          url: `https://supabase.com/solutions/beginners`,
          images: [
            {
              url: `/images/solutions/ai-builders/ai-builders-og.png`,
            },
          ],
        }}
      />
      <Layout className="overflow-visible">
        <ProductHeader
          {...content.heroSection}
          className="[&_h1]:2xl:!text-5xl bg-default border-0 lg:pb-8 [&_.ph-footer]:mt-0 [&_.ph-footer]:lg:mt-16 [&_.ph-footer]:xl:mt-32"
          sectionContainerClassName="lg:gap-4"
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
        <SingleQuote
          id="quote"
          className="!pb-8 md:!pb-12 [&_q]:max-w-2xl"
          quote={{
            text: 'Supabase enabled us to focus on building the best email infrastructure for developers — without worrying about backend complexity. Their authentication, database, and support have been game-changers for our rapid growth.',
            author: 'Zeno Rocha',
            role: 'CEO at Resend',
            link: '/customers/resend',
            logo: (
              <Image
                draggable={false}
                src="/images/blog/avatars/zeno-rocha.png"
                alt="Zeno Rocha, CEO at Resend"
                className="w-10 h-10 rounded-full overflow-hidden object-cover"
                width={28}
                height={28}
              />
            ),
          }}
        />
        <PlatformStarterSection {...content.platformStarterSection} />
        <MPCSection {...content.mcp} />
      </Layout>
    </>
  )
}

export default BeginnersPage
