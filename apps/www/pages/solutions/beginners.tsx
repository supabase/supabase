import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'

import Layout from '~/components/Layouts/Default'
import ProductHeader from '~/components/Sections/ProductHeader2'
import getContent from '~/data/solutions/beginners'

const WhySupabase = dynamic(() => import('~/components/Solutions/FeaturesSection'))
const PlatformSection = dynamic(() => import('~/components/Solutions/PlatformSection'))
const PlatformStarterSection = dynamic(
  () => import('~/components/Solutions/PlatformStarterSection')
)
const TwitterSocialSection = dynamic(() => import('~/components/TwitterSocialSection'))
const BeginnerMPCSection = dynamic(() => import('~/components/Solutions/BeginnerMPCSection'))

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
        <TwitterSocialSection {...content.twitterSocialSection} />
        <PlatformStarterSection {...content.platformStarterSection} />
        <BeginnerMPCSection {...content.mcp} />
      </Layout>
    </>
  )
}

export default BeginnersPage
