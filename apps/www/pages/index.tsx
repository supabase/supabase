import Hero from '~/components/Hero/Hero'
import Layout from '~/components/Layouts/Default'
import Logos from '~/components/logos'
import getContent from '~/data/home/content'
import { organizationSchema, serializeJsonLd, websiteSchema } from '~/lib/json-ld'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Head from 'next/head'

const Products = dynamic(() => import('~/components/Products/index'))
const HeroFrameworks = dynamic(() => import('~/components/Hero/HeroFrameworks'))
const CustomerStories = dynamic(() => import('components/CustomerStories'))
const BuiltWithSupabase = dynamic(() => import('components/BuiltWithSupabase'))
const DashboardFeatures = dynamic(() => import('~/components/DashboardFeatures'))
const TwitterSocialSection = dynamic(() => import('~/components/TwitterSocialSection'))
const OpenSourceSection = dynamic(() => import('~/components/OpenSourceSection'))
const CTABanner = dynamic(() => import('components/CTABanner/index'))

// When updating page content, also update public/llms/homepage.txt

const HOMEPAGE_JSON_LD = serializeJsonLd([organizationSchema(), websiteSchema()])

const Index = () => {
  const content = getContent()

  return (
    <>
      <NextSeo canonical="https://supabase.com/" />
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: HOMEPAGE_JSON_LD }} />
      </Head>
      <Layout>
        <Hero />
        <Logos />
        <Products {...content.productsSection} />
        <HeroFrameworks />
        <CustomerStories />
        <BuiltWithSupabase />
        <DashboardFeatures {...content.dashboardFeatures} />
        <TwitterSocialSection {...content.twitterSocialSection} />
        <OpenSourceSection />
        <CTABanner className="border-none" />
      </Layout>
    </>
  )
}

export default Index
