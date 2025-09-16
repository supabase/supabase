import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'

import Layout from 'components/Layouts/Default'
import ProductHeader from 'components/Sections/ProductHeader2'
import Quotes from 'components/Solutions/Quotes'
import SolutionsStickyNav from 'components/SolutionsStickyNav'

import getContent from 'data/solutions/no-code'

const PlatformSection = dynamic(() => import('components/Solutions/PlatformSection'))
const PlatformStarterSection = dynamic(() => import('components/Solutions/TwoColumnsSection'))
const WhySupabase = dynamic(() => import('components/Solutions/FeaturesSection'))

interface Solution {
  id: string
  name: string
  href: string
  icon: string
}

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
          url: `https://supabase.com/solutions/no-code`,
        }}
      />
      <Layout className="overflow-visible relative">
        <SolutionsStickyNav activeItem="no-code" type="skill-based" />
        <ProductHeader
          {...content.heroSection}
          className="[&_h1]:2xl:!text-5xl bg-default border-0 lg:pb-24 [&_.ph-footer]:mt-0 [&_.ph-footer]:lg:mt-16 [&_.ph-footer]:xl:mt-32"
          sectionContainerClassName="lg:gap-4"
        />
        <Quotes {...content.quotes} />
        <WhySupabase {...content.why} />
        <PlatformSection {...content.platform} />
        <PlatformStarterSection {...content.platformStarterSection} />
      </Layout>
    </>
  )
}

export default BeginnersPage
