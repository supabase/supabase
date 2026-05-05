import 'swiper/css'

import DefaultLayout from '~/components/Layouts/Default'
import ModulesNav from '~/components/Modules/ModulesNav'
import vectorPageData from '~/data/products/modules/vector'
import { useBreakpoint } from 'common'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { PRODUCT_MODULES_NAMES, PRODUCT_MODULES_SHORTNAMES } from 'shared-data/products'

import { serializeJsonLd, softwareApplicationSchema } from '@/lib/json-ld'

const ProductModulesHeader = dynamic(() => import('~/components/Sections/ProductModulesHeader'))
const HighlightCards = dynamic(() => import('~/components/Sections/HighlightCards'))
const FeaturesSection = dynamic(() => import('~/components/Sections/FeaturesSection'))
const UseCasesSection = dynamic(() => import('~/components/Sections/UseCasesSection'))
const CenteredTitleImage = dynamic(() => import('~/components/Sections/CenteredTitleImage'))
const CustomerQuotesSection = dynamic(() => import('~/components/Sections/CustomerQuotesSection'))
const TimedTabsSection = dynamic(() => import('~/components/Sections/TimedTabsSection'))
const ProductsCta = dynamic(() => import('~/components/Sections/ProductsCta'))
const EnterpriseCta = dynamic(() => import('~/components/Sections/EnterpriseCta'))

// When updating page content, also update public/llms/vector.txt

function VectorPage() {
  // base path for images
  const isXs = useBreakpoint(640)
  const pageData = vectorPageData(isXs)
  const meta_title = pageData.metaTitle
  const meta_description = pageData.metaDescription
  const meta_image = pageData.metaImage

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/modules/vector`,
          images: [
            {
              url: meta_image,
            },
          ],
        }}
      />
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(
              softwareApplicationSchema({
                name: 'Supabase Vector',
                description: meta_description,
                url: 'https://supabase.com/modules/vector',
                image: meta_image,
              })
            ),
          }}
        />
      </Head>
      <DefaultLayout className="bg-alternative!" stickyNavbar={false}>
        <ModulesNav activePage={PRODUCT_MODULES_NAMES.VECTOR} docsUrl={pageData.docsUrl} />
        <ProductModulesHeader {...pageData.heroSection} />
        <HighlightCards {...(pageData.highlightsSection as any)} />
        <CenteredTitleImage {...pageData.integrations} />
        <TimedTabsSection {...pageData.APIsection} />
        <div className="bg-alternative">
          <UseCasesSection {...pageData.useCasesSection} />
          <FeaturesSection {...pageData.featuresSection} />
        </div>
        <CustomerQuotesSection {...pageData.quotesSection} />
        <div className="bg-linear-to-t from-alternative to-transparent">
          <EnterpriseCta />
        </div>
        <div className="bg-background">
          <div className="w-full h-px bg-linear-to-r from-background-alternative via-border to-background-alternative" />
          <ProductsCta currentProduct={PRODUCT_MODULES_SHORTNAMES.VECTOR} />
        </div>
      </DefaultLayout>
    </>
  )
}

export default VectorPage
