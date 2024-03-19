import React from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { useBreakpoint } from 'common'

import { PRODUCT_NAMES, PRODUCT_SHORTNAMES } from 'shared-data/products'
import page from '~/data/products/functions/page'

import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import ProductHeader from '~/components/Sections/ProductHeader2'
import ProductsNav from '~/components/Products/ProductsNav'

import SectionContainer from '~/components/Layouts/SectionContainer'

const HighlightColumns = dynamic(() => import('~/components/Sections/HighlightColumns'))
const TimedAccordionSection = dynamic(() => import('~/components/Sections/TimedAccordionSection'))
const TimedAccordionPanels = dynamic(() => import('~/components/Sections/TimedAccordionPanels'))
const ProductsCta = dynamic(() => import('~/components/Sections/ProductsCta2'))
const LocalDXGrid = dynamic(() => import('~/components/Products/Functions/LocalDXGrid'))
const GlobalPresenceSection = dynamic(
  () => import('~/components/Products/Functions/GlobalPresenceSection')
)
const ExamplesCarousel = dynamic(() => import('~/components/Examples/ExamplesCarousel'))

function Database() {
  // base path for images
  const { basePath } = useRouter()
  const isXs = useBreakpoint(640)
  const pageData = page(isXs)

  return (
    <>
      <NextSeo
        title={pageData.metaTitle}
        description={pageData.metaDescription}
        openGraph={{
          title: pageData.metaTitle,
          description: pageData.metaDescription,
          url: `https://supabase.com/edge-functions`,
          images: [
            {
              url: `https://supabase.com${basePath}/images/product/database/database-og.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout className="overflow-hidden">
        <ProductsNav activePage={PRODUCT_NAMES.FUNCTIONS} />
        <ProductHeader
          {...pageData.heroSection}
          footer={<HighlightColumns highlights={pageData.highlightsSection.highlights} />}
        />
        <SectionContainer className="flex flex-col gap-4 lg:gap-8 !pb-0">
          <ExamplesCarousel {...pageData.examplesSection} />
        </SectionContainer>
        <SectionContainer className="flex flex-col gap-4">
          <div>
            <h2 className="h2">{pageData.localDXsection.title}</h2>
            <p className="text-foreground-lighter lg:w-1/2">{pageData.localDXsection.paragraph}</p>
          </div>
          <div className="mt-4 md:mt-8">
            <LocalDXGrid />
          </div>
        </SectionContainer>
        <SectionContainer className="flex flex-col gap-4 lg:gap-8">
          <GlobalPresenceSection {...pageData.globalPresenceSection} />
        </SectionContainer>
        <SectionContainer className="flex flex-col gap-4 lg:gap-8">
          <h2 className="h2">{pageData.o11y.title}</h2>
          <TimedAccordionPanels {...pageData.o11y} />
        </SectionContainer>
        <SectionContainer className="flex flex-col gap-4 lg:gap-8">
          <h2 className="h2">{pageData.integratesWithSupabase.title}</h2>
          <TimedAccordionSection tabs={pageData.integratesWithSupabase.useCases} />
        </SectionContainer>
        <ProductsCta currentProduct={PRODUCT_SHORTNAMES.FUNCTIONS} />
      </DefaultLayout>
    </>
  )
}

export default Database
