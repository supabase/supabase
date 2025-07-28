import dynamic from 'next/dynamic'
import getContent from '~/data/home/content'
import Layout from '~/components/Layouts/Default'
import Hero from '~/components/Hero/Hero'
import Logos from '~/components/logos'

const Products = dynamic(() => import('~/components/Products/index'))
const HeroFrameworks = dynamic(() => import('~/components/Hero/HeroFrameworks'))
const CustomerStories = dynamic(() => import('components/CustomerStories'))
const BuiltWithSupabase = dynamic(() => import('components/BuiltWithSupabase'))
const DashboardFeatures = dynamic(() => import('~/components/DashboardFeatures'))
const TwitterSocialSection = dynamic(() => import('~/components/TwitterSocialSection'))
const CTABanner = dynamic(() => import('components/CTABanner/index'))

const Index = () => {
  const content = getContent()

  return (
    <Layout>
      <Hero />
      <Logos />
      <Products {...content.productsSection} />
      <HeroFrameworks />
      <CustomerStories />
      <BuiltWithSupabase />
      <DashboardFeatures {...content.dashboardFeatures} />
      <TwitterSocialSection {...content.twitterSocialSection} />
      <CTABanner className="border-none" />
    </Layout>
  )
}

export default Index
