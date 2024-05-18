import 'swiper/css'

import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import DefaultLayout from '~/components/Layouts/Default'

import { useBreakpoint } from 'common'
import { PRODUCT_SHORTNAMES } from '~/lib/constants'
import vectorPageData from '~/data/products/vector/pageData'
import ProductsNav from '~/components/Products/ProductsNav'
import { PRODUCT_NAMES } from 'shared-data/products'

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
  const isXs = useBreakpoint(640)
  const { basePath } = useRouter()
  const meta_title = 'Supabase Vector | The Postgres Vector database.'
  const meta_description =
    'An open source Vector database for developing AI applications. Use pgvector to store, index, and access embeddings, and our AI toolkit to build AI applications with Hugging Face and OpenAI.'
  const pageData = vectorPageData(isXs)

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
      <DefaultLayout className="!bg-alternative">
        <ProductsNav activePage={PRODUCT_NAMES.VECTOR} />
        <ProductHeaderCentered {...pageData.heroSection} />
        <HighlightCards {...(pageData.highlightsSection as any)} />
        <CenteredTitleImage {...pageData.integrations} />
        <TimedTabsSection {...pageData.APIsection} />
        <div className="bg-alternative">
          <UseCasesSection {...pageData.useCasesSection} />
          <FeaturesSection {...pageData.featuresSection} />
        </div>
        <CustomerQuotesSection {...pageData.quotesSection} />
        <div className="bg-gradient-to-t from-alternative to-transparent">
          <EnterpriseCta />
        </div>
        <div className="bg-background">
          <div className="w-full h-[1px] bg-gradient-to-r from-background-alternative via-border to-background-alternative" />
          <ProductsCta currentProduct={PRODUCT_SHORTNAMES.VECTOR} />
        </div>
      </DefaultLayout>
    </>
  )
}

export default VectorPage
