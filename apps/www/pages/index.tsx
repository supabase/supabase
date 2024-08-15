import dynamic from 'next/dynamic'
import content from '~/data/home/content'
import Layout from '~/components/Layouts/Default'
import Hero from '~/components/Hero/Hero'
import HeroFrameworks from '~/components/Hero/HeroFrameworks'

const Products = dynamic(() => import('~/components/Products/index'))
const Logos = dynamic(() => import('~/components/logos'))
const BuiltExamples = dynamic(() => import('components/BuiltWithSupabase/index'))
const MadeForDevelopers = dynamic(() => import('components/MadeForDevelopers/index'))
const AdminAccess = dynamic(() => import('components/AdminAccess/index'))
const CustomerStories = dynamic(() => import('components/CustomerStories'))
const TwitterSocialSection = dynamic(() => import('~/components/TwitterSocialSection'))
const CTABanner = dynamic(() => import('components/CTABanner/index'))
const ReactTooltip = dynamic(() => import('react-tooltip'), { ssr: false })

const Index = () => {
  return (
    <Layout>
      <Hero />
      <Logos />
      <Products {...content.productsSection} />
      <HeroFrameworks className="mt-4 lg:mt-6" />
      <TwitterSocialSection />
      <BuiltExamples />
      <MadeForDevelopers />
      <AdminAccess />
      <CustomerStories />
      <CTABanner />
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
