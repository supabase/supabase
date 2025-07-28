import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'

import DefaultLayout from '~/components/Layouts/Default'
import ModulesNav from '~/components/Modules/ModulesNav'
import ProductModulesHeader from '~/components/Sections/ProductModulesHeader'
import SectionContainer from '~/components/Layouts/SectionContainer'

import { PRODUCT_MODULES_NAMES } from 'shared-data/products'
import CronPageData from '~/data/products/modules/cron'

const HighlightCards = dynamic(() => import('~/components/Sections/HighlightCards'))
const CronSQLSection = dynamic(() => import('~/components/Modules/Cron/CronSQLSection'))
const ImageParagraphSection = dynamic(() => import('~/components/Sections/ImageParagraphSection'))
const CTABanner = dynamic(() => import('~/components/CTABanner'))

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
        <SectionContainer>{pageData.videoSection.video}</SectionContainer>
        <HighlightCards {...(pageData.highlightsSection as any)} />
        <CronSQLSection {...pageData.section1} />
        <ImageParagraphSection {...pageData.section2} />
        <ImageParagraphSection {...pageData.section3} />
        <ImageParagraphSection {...pageData.section4} />
        <div className="bg-gradient-to-t from-alternative to-transparent mt-8 lg:mt-24">
          <CTABanner />
        </div>
      </DefaultLayout>
    </>
  )
}

export default CronPage
