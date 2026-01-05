import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'

import DefaultLayout from '~/components/Layouts/Default'
import ModulesNav from '~/components/Modules/ModulesNav'
import ProductModulesHeader from '~/components/Sections/ProductModulesHeader'
import SectionContainer from '~/components/Layouts/SectionContainer'

import { PRODUCT_MODULES_NAMES } from 'shared-data/products'
import SandboxPageData from '~/data/products/modules/sandbox'

const HighlightCards = dynamic(() => import('~/components/Sections/HighlightCards'))
const ImageParagraphSection = dynamic(() => import('~/components/Sections/ImageParagraphSection'))
const CTABanner = dynamic(() => import('~/components/CTABanner'))

function SandboxPage() {
  const pageData = SandboxPageData()

  return (
    <>
      <NextSeo
        title={pageData.metaTitle}
        description={pageData.metaDescription}
        openGraph={{
          title: pageData.metaTitle,
          description: pageData.metaDescription,
          url: `https://supabase.com/modules/sandbox`,
          images: [
            {
              url: pageData.metaImage,
            },
          ],
        }}
      />
      <DefaultLayout className="!bg-alternative" stickyNavbar={false}>
        <ModulesNav activePage={PRODUCT_MODULES_NAMES.SANDBOX} docsUrl={pageData.docsUrl} />
        <ProductModulesHeader {...pageData.heroSection} />
        <SectionContainer>{pageData.videoSection.video}</SectionContainer>
        <HighlightCards {...pageData.highlightsSection} />
        <ImageParagraphSection {...pageData.section1} />
        <ImageParagraphSection {...pageData.section2} />
        <ImageParagraphSection {...pageData.section3} />
        <div className="bg-gradient-to-t from-alternative to-transparent mt-8 lg:mt-24">
          <CTABanner />
        </div>
      </DefaultLayout>
    </>
  )
}

export default SandboxPage
