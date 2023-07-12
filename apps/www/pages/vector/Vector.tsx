import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import DefaultLayout from '~/components/Layouts/Default'

import { PRODUCT_SHORTNAMES } from '~/lib/constants'
import pageData from '~/data/products/vector/pageData'

import 'swiper/swiper.min.css'

const ProductHeaderCentered = dynamic(() => import('~/components/Sections/ProductHeaderCentered'))
const HighlightCards = dynamic(() => import('~/components/Sections/HighlightCards'))
const FeaturesSection = dynamic(() => import('~/components/Sections/FeaturesSection'))
const UseCasesSection = dynamic(() => import('~/components/Sections/UseCasesSection'))
const CenteredTitleImage = dynamic(() => import('~/components/Sections/CenteredTitleImage'))
const CustomerQuotesSection = dynamic(() => import('~/components/Sections/CustomerQuotesSection'))
const TimedTabsSection = dynamic(() => import('~/components/Sections/TimedTabsSection'))
const ProductsCta = dynamic(() => import('~/components/Sections/ProductsCta'))
const EnterpriseCta = dynamic(() => import('~/components/Sections/EnterpriseCta'))

function VectorPage() {
  // base path for images
  const { basePath } = useRouter()
  const meta_title = 'Supabase Vector | The open source vector toolkit for Postgres.'
  const meta_description =
    'An open source toolkit for developing AI applications using Postgres and pgvector. Integrate with your favorite ML-models to store, index, and access vector embeddings for any AI use case.'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/vector`,
          images: [
            {
              url: `https://supabase.com${basePath}/images/product/vector/og.png`,
            },
          ],
        }}
      />
      <DefaultLayout className="!bg-scale-300 dark:!bg-scale-100">
        <ProductHeaderCentered {...pageData.heroSection} />
        <HighlightCards {...pageData.highlightsSection} />
        <CenteredTitleImage {...pageData.integrations} />
        <TimedTabsSection {...pageData.APIsection} />
        <div className="bg-white dark:bg-[#121212]">
          <UseCasesSection {...pageData.useCasesSection} />
          <FeaturesSection {...pageData.featuresSection} />
        </div>
        <CustomerQuotesSection {...pageData.quotesSection} />
        <div className="bg-gradient-to-t from-white dark:from-[#121212] to-transparent">
          <EnterpriseCta />
        </div>
        <div className="bg-scale-200">
          <div className="w-full h-[1px] bg-gradient-to-r from-scale-100 via-scale-500 dark:via-scale-600 to-scale-100" />
          <ProductsCta currentProduct={PRODUCT_SHORTNAMES.VECTOR} />
        </div>
      </DefaultLayout>
    </>
  )
}

export default VectorPage
