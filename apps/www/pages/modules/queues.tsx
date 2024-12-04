import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'

import DefaultLayout from '~/components/Layouts/Default'
import ModulesNav from '~/components/Modules/ModulesNav'
import ProductModulesHeader from '~/components/Sections/ProductModulesHeader'
import SectionContainer from '~/components/Layouts/SectionContainer'

import { PRODUCT_MODULES_NAMES } from 'shared-data/products'
import QueuesPageData from '~/data/products/modules/queues'

const HighlightCards = dynamic(() => import('~/components/Sections/HighlightCards'))
const QueuesSQLSection = dynamic(() => import('~/components/Modules/Queues/QueuesSQLSection'))
const ImageParagraphSection = dynamic(() => import('~/components/Sections/ImageParagraphSection'))
const CTABanner = dynamic(() => import('~/components/CTABanner'))

function CronPage() {
  const pageData = QueuesPageData()

  return (
    <>
      <NextSeo
        title={pageData.metaTitle}
        description={pageData.metaDescription}
        openGraph={{
          title: pageData.metaTitle,
          description: pageData.metaDescription,
          url: `https://supabase.com/modules/queues`,
          images: [
            {
              url: pageData.metaImage,
            },
          ],
        }}
      />
      <DefaultLayout className="!bg-alternative" stickyNavbar={false}>
        <ModulesNav activePage={PRODUCT_MODULES_NAMES.QUEUES} docsUrl={pageData.docsUrl} />
        <ProductModulesHeader {...pageData.heroSection} />
        <SectionContainer>{pageData.videoSection.video}</SectionContainer>
        <HighlightCards {...pageData.highlightsSection} />
        {/* <SectionContainer className="flex items-center justify-center text-center !pt-4 !pb-0">
          <div className="p-4 md:p-8 border-b w-full">
            <h3 className="text-lg text-foreground">{pageData.oss.title}</h3>
            <p className="text-foreground-lighter text-sm">{pageData.oss.paragraph}</p>
          </div>
        </SectionContainer> */}
        <QueuesSQLSection {...pageData.section1} />
        <ImageParagraphSection {...pageData.section2} className="!pt-0" />
        <ImageParagraphSection {...pageData.section3} className="!pt-0" />
        <div className="bg-gradient-to-t from-alternative to-transparent mt-8 lg:mt-24">
          <CTABanner />
        </div>
      </DefaultLayout>
    </>
  )
}

export default CronPage
