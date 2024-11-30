import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

import DefaultLayout from '~/components/Layouts/Default'
import CronPageData from '~/data/products/modules/cron'
import ModulesNav from '~/components/Modules/ModulesNav'
import CTABanner from '~/components/CTABanner'

import { PRODUCT_MODULES_NAMES } from 'shared-data/products'
import SectionContainer from '../../components/Layouts/SectionContainer'

const ProductModulesHeader = dynamic(() => import('~/components/Sections/ProductModulesHeader'))
const HighlightCards = dynamic(() => import('~/components/Sections/HighlightCards'))
const CronSQLSection = dynamic(() => import('~/components/Modules/Cron/CronSQLSection'))
const CronUISection = dynamic(() => import('~/components/Modules/Cron/CronUISection'))
const CronExtensibleSection = dynamic(
  () => import('~/components/Modules/Cron/CronExtensibleSection')
)
const CenteredImage = dynamic(() => import('~/components/Sections/CenteredImage'))

function CronPage() {
  // base path for images
  const { basePath } = useRouter()
  const pageData = CronPageData()

  return (
    <>
      <NextSeo
        title={pageData.metaTitle}
        description={pageData.metaDescription}
        openGraph={{
          title: pageData.metaTitle,
          description: pageData.metaDescription,
          url: `https://supabase.com/modules/cron-jobs`,
          images: [
            {
              url: `https://supabase.com${basePath}/images/product/vector/og.png`,
            },
          ],
        }}
      />
      <DefaultLayout className="!bg-alternative" stickyNavbar={false}>
        <ModulesNav activePage={PRODUCT_MODULES_NAMES.CRON_JOBS} docsUrl={pageData.docsUrl} />
        <ProductModulesHeader {...pageData.heroSection} />
        <SectionContainer className="">{pageData.video.image}</SectionContainer>
        {/* <CenteredImage {...pageData.centeredImage} /> */}
        <HighlightCards {...(pageData.highlightsSection as any)} />
        <CronSQLSection {...pageData.section1} />
        <CronUISection {...pageData.section2} className="!py-0" />
        <CronUISection {...pageData.section3} className="!py-0" />
        <CronExtensibleSection {...pageData.section4} className="!pb-0" />
        <div className="bg-gradient-to-t from-alternative to-transparent mt-8 lg:mt-24">
          <CTABanner />
        </div>
      </DefaultLayout>
    </>
  )
}

export default CronPage
