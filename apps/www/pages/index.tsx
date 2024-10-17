import dynamic from 'next/dynamic'
import content from '~/data/home/content'
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
const ReactTooltip = dynamic(() => import('react-tooltip'), { ssr: false })

const Index = () => {
  return (
    <Layout>
      <Hero />
      <Logos />
      <Products {...content.productsSection} />
      <HeroFrameworks />
      <CustomerStories />
      <BuiltWithSupabase />
      <DashboardFeatures {...content.dashboardFeatures} />
      <TwitterSocialSection />
      <CTABanner className="border-none" />
      <ReactTooltip
        effect="solid"
        place="bottom"
        backgroundColor="hsl(var(--background-alternative-default))"
        textColor="hsl(var(--foreground-light))"
        className="!max-w-[320px] !px-3 whitespace-pre-line"
        uuid="homepage-tt"
      />
    </Layout>
  )
}

export default Index
