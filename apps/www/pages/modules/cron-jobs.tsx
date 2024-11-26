import 'swiper/css'

import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import DefaultLayout from '~/components/Layouts/Default'

import { useBreakpoint } from 'common'
import { PRODUCT_SHORTNAMES } from '~/lib/constants'
import CronPageData from '~/data/products/modules/cron'
import ModulesNav from '~/components/Modules/ModulesNav'
import { PRODUCT_MODULES, PRODUCT_MODULES_NAMES, PRODUCT_NAMES } from 'shared-data/products'

const ProductModulesHeader = dynamic(() => import('~/components/Sections/ProductModulesHeader'))
const HighlightCards = dynamic(() => import('~/components/Sections/HighlightCards'))
const FeaturesSection = dynamic(() => import('~/components/Sections/FeaturesSection'))
const UseCasesSection = dynamic(() => import('~/components/Sections/UseCasesSection'))
const CenteredImage = dynamic(() => import('~/components/Sections/CenteredImage'))
const CustomerQuotesSection = dynamic(() => import('~/components/Sections/CustomerQuotesSection'))
const TimedTabsSection = dynamic(() => import('~/components/Sections/TimedTabsSection'))
const ProductsCta = dynamic(() => import('~/components/Sections/ProductsCta'))
const EnterpriseCta = dynamic(() => import('~/components/Sections/EnterpriseCta'))

function CronPage() {
  // base path for images
  const isXs = useBreakpoint(640)
  const { basePath } = useRouter()
  const meta_title = 'Supabase Cron | Schedule and automate tasks'
  const meta_description = 'Schedule and automate tasks at scale'
  const pageData = CronPageData(isXs)

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
        <ModulesNav activePage={PRODUCT_MODULES_NAMES.CRON_JOBS} />
        <ProductModulesHeader {...pageData.heroSection} />
        <CenteredImage {...pageData.integrations} />
        <HighlightCards {...(pageData.highlightsSection as any)} />
        {/* 
        <TimedTabsSection {...pageData.APIsection} />
        <div className="bg-alternative">
          <UseCasesSection {...pageData.useCasesSection} />
          <FeaturesSection {...pageData.featuresSection} />
        </div>
        <CustomerQuotesSection {...pageData.quotesSection} /> */}
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

export default CronPage
