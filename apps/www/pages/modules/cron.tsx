import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'

import DefaultLayout from '~/components/Layouts/Default'
import CronPageData from '~/data/products/modules/cron'
import ModulesNav from '~/components/Modules/ModulesNav'
import CTABanner from '~/components/CTABanner'
import SectionContainer from '~/components/Layouts/SectionContainer'
import ProductModulesHeader from '~/components/Sections/ProductModulesHeader'

import { PRODUCT_MODULES_NAMES } from 'shared-data/products'

const HighlightCards = dynamic(() => import('~/components/Sections/HighlightCards'))
const CronSQLSection = dynamic(() => import('~/components/Modules/Cron/CronSQLSection'))
const ImageLeftSection = dynamic(() => import('~/components/Modules/Cron/ImageLeftSection'))
const ImageRightSection = dynamic(() => import('~/components/Modules/Cron/ImageRightSection'))

function CronPage() {
  const pageData = CronPageData()

  return (
    <>
      <NextSeo
        title={pageData.metaTitle}
        description={pageData.metaDescription}
        openGraph={{
          title: pageData.metaTitle,
          description: pageData.metaDescription,
          url: `https://supabase.com/modules/cron`,
          images: [
            {
              url: pageData.metaImage,
            },
          ],
        }}
      />
      <DefaultLayout className="!bg-alternative" stickyNavbar={false}>
        <ModulesNav activePage={PRODUCT_MODULES_NAMES.CRON} docsUrl={pageData.docsUrl} />
        <ProductModulesHeader {...pageData.heroSection} />
        <SectionContainer>{pageData.video.image}</SectionContainer>
        <HighlightCards {...(pageData.highlightsSection as any)} />
        <CronSQLSection {...pageData.section1} />
        <ImageLeftSection {...pageData.section2} className="!py-0" />
        <ImageRightSection {...pageData.section3} className="!pb-0" />
        <ImageLeftSection {...pageData.section4} />
        <div className="bg-gradient-to-t from-alternative to-transparent mt-8 lg:mt-24">
          <CTABanner />
        </div>
      </DefaultLayout>
    </>
  )
}

export default CronPage
