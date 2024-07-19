import React from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { useBreakpoint } from 'common'

import { PRODUCT_NAMES, PRODUCT_SHORTNAMES } from 'shared-data/products'
import page from '~/data/products/functions/page'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import ProductHeader from '~/components/Sections/ProductHeader2'
import HighlightColumns from '~/components/Sections/HighlightColumns'
import ProductsNav from '~/components/Products/ProductsNav'

const ExamplesCarousel = dynamic(() => import('~/components/Examples/ExamplesCarousel'))
const GlobalPresenceSection = dynamic(
  () => import('~/components/Products/Functions/GlobalPresenceSection')
)
const LocalDXGrid = dynamic(() => import('~/components/Products/Functions/LocalDXGrid'))
const ProductsCta = dynamic(() => import('~/components/Sections/ProductsCta2'))
const TimedAccordionPanels = dynamic(() => import('~/components/Sections/TimedAccordionPanels'))
const TimedAccordionSection = dynamic(() => import('~/components/Sections/TimedAccordionSection'))

function EdgeFunctions() {
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
              url: `https://supabase.com${basePath}/images/product/functions/functions-og.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <ProductsNav activePage={PRODUCT_NAMES.FUNCTIONS} />
        <ProductHeader
          {...pageData.heroSection}
          footer={<HighlightColumns highlights={pageData.highlightsSection.highlights} />}
        />
        <div className="overflow-hidden">
          <SectionContainer className="flex flex-col gap-4 lg:gap-8 !pb-0" id="examples">
            <ExamplesCarousel {...pageData.examplesSection} />
          </SectionContainer>
        </div>
        <SectionContainer className="flex flex-col gap-4" id="developer-experience">
          <div>
            <h2 className="h2">{pageData.localDXsection.title}</h2>
            <p className="text-foreground-lighter lg:w-1/2">{pageData.localDXsection.paragraph}</p>
          </div>
          <div className="mt-4 md:mt-8">
            <LocalDXGrid />
          </div>
        </SectionContainer>
        <SectionContainer className="flex flex-col gap-4 lg:gap-8" id="global-presence">
          <GlobalPresenceSection {...pageData.globalPresenceSection} />
        </SectionContainer>
        <div className="overflow-hidden">
          <SectionContainer className="flex flex-col gap-4 lg:gap-8" id="observability">
            <h2 className="h2">{pageData.o11y.title}</h2>
            <TimedAccordionPanels {...pageData.o11y} />
          </SectionContainer>
        </div>
        <div className="overflow-hidden">
          <SectionContainer className="flex flex-col gap-4 lg:gap-8" id="integrates-with-supabase">
            <h2 className="h2">{pageData.integratesWithSupabase.title}</h2>
            <TimedAccordionSection tabs={pageData.integratesWithSupabase.useCases} />
          </SectionContainer>
        </div>
        <ProductsCta currentProduct={PRODUCT_SHORTNAMES.FUNCTIONS} className="!pt-0 lg:!pt-16" />
      </DefaultLayout>
    </>
  )
}

export default EdgeFunctions
