import 'swiper/css'

import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import ProductsNav from '~/components/Products/ProductsNav'
import { RealtimeFeatureSections } from '~/components/Realtime/RealtimeFeatureSections'
import { RealtimePageHeader } from '~/components/Realtime/RealtimePageHeader'
import RealtimeShowcase from '~/components/Realtime/realtime-showcase'
import APISection from '~/components/Sections/APISection'
import ApiExamples from 'data/products/realtime/api-examples'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { PRODUCT_NAMES } from 'shared-data/products'

import { breadcrumbs } from '@/lib/breadcrumbs'
import { breadcrumbListSchema, serializeJsonLd, softwareApplicationSchema } from '@/lib/json-ld'

const RealtimeTableHero = dynamic(() => import('~/components/Realtime/Hero/RealtimeTableHero'), {
  ssr: false,
})

// When updating page content, also update public/llms/realtime.txt

function RealtimePage() {
  const { basePath } = useRouter()
  const meta_title = 'Realtime | Sync your data in real time'
  const meta_description =
    'Listens to changes in a PostgreSQL Database and broadcasts them over WebSockets'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/realtime`,
          images: [
            {
              url: `https://supabase.com${basePath}/images/realtime/og.jpg`,
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
                name: 'Supabase Realtime',
                description: meta_description,
                url: 'https://supabase.com/realtime',
                image: `https://supabase.com${basePath}/images/realtime/og.jpg`,
              })
            ),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(breadcrumbListSchema(breadcrumbs.realtime)),
          }}
        />
      </Head>
      <DefaultLayout>
        <ProductsNav activePage={PRODUCT_NAMES.REALTIME} />
        <RealtimePageHeader />
        <RealtimeTableHero />

        <SectionContainer>
          <RealtimeFeatureSections />
        </SectionContainer>

        <SectionContainer id="playground" className="pb-0! mb-0! scroll-mt-24">
          <div className="mb-12 prose">
            <h3>Playground - give it a go!</h3>
            <p className="text-foreground-light mt-0">
              Build any kind of Realtime application with ease, including any of these scenarios.
            </p>
          </div>
          <RealtimeShowcase />
        </SectionContainer>
        <SectionContainer>
          <APISection
            title="Simple and convenient APIs"
            // @ts-ignore
            content={ApiExamples}
            size="large"
            text={[
              <p key={0} className="text-base lg:text-lg">
                APIs that you can understand. With powerful libraries that work on client and
                server-side applications.
              </p>,
            ]}
            documentation_link={'/docs/guides/realtime/broadcast'}
          />
        </SectionContainer>

        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default RealtimePage
