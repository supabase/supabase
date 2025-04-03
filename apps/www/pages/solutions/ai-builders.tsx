import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'

import Layout from '~/components/Layouts/Default'
import ProductHeader from '~/components/Sections/ProductHeader2'

import content from '~/data/solutions/ai-builders'
import EnterpriseLogos from '../../components/Enterprise/EnterpriseLogos'
import SectionContainer from '../../components/Layouts/SectionContainer'

const UseCases = dynamic(() => import('components/Solutions/UseCases'))
const Quotes = dynamic(() => import('components/Solutions/Quotes'))
const WhySupabase = dynamic(() => import('~/components/Solutions/FeaturesSection'))
const FeaturesGrid = dynamic(() => import('~/components/Solutions/FeaturesGrid'))
const VideosSection = dynamic(() => import('~/components/Solutions/Videos'))

const Enterprise: NextPage = () => (
  <>
    <NextSeo
      title={content.metadata.metaTitle}
      description={content.metadata.metaDescription}
      openGraph={{
        title: content.metadata.metaTitle,
        description: content.metadata.metaDescription,
        url: `https://supabase.com/enterprise`,
        images: [
          {
            url: `/images/enterprise/enterprise-og.png`,
          },
        ],
      }}
    />
    <Layout className="overflow-visible">
      <ProductHeader
        {...content.heroSection}
        className="[&_h1]:2xl:!text-5xl bg-default border-0 lg:pb-8 [&_.ph-footer]:mt-0 [&_.ph-footer]:lg:mt-16 [&_.ph-footer]:xl:mt-32"
        sectionContainerClassName="lg:gap-4"
        // to do: get logos for page
        // footer={<EnterpriseLogos className="lg:max-w-xs xl:max-w-none" />}
        footerPosition="left"
      />
      <Quotes {...content['quotes']} />
      <WhySupabase {...content.why} />
      <FeaturesGrid {...content.features} />
      <VideosSection {...content.testimonials} />
      {/* <EnterpriseQuote {...content.quote} /> */}
      {/* <CTAForm /> */}
    </Layout>
  </>
)

export default Enterprise
