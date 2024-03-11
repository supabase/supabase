import React from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'

import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import ProductHeader from '~/components/Sections/ProductHeader2'
import ProductsNav from '../components/Products/ProductsNav'
import { PRODUCT_NAMES } from 'shared-data/products'
import page from '../data/products/functions/page'
import { useBreakpoint } from 'common'
import SectionContainer from '../components/Layouts/SectionContainer'

const HighlightColumns = dynamic(() => import('~/components/Sections/HighlightColumns'))
const TimedAccordionSection = dynamic(() => import('~/components/Sections/TimedAccordionSection'))

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
      <DefaultLayout>
        <ProductsNav activePage={PRODUCT_NAMES.FUNCTIONS} />
        <ProductHeader
          {...pageData.heroSection}
          footer={<HighlightColumns highlights={pageData.highlightsSection.highlights} />}
        />
        <SectionContainer className="flex flex-col gap-4 lg:gap-8">
          <h2 className="text-3xl xl:text-4xl max-w-[280px] sm:max-w-xs xl:max-w-[360px]">
            {pageData.useCasesSection.title}
          </h2>
          <TimedAccordionSection tabs={pageData.useCasesSection.useCases} />
        </SectionContainer>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default Database
