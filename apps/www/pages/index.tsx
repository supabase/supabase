import dynamic from 'next/dynamic'
import { getSortedPosts } from '~/lib/posts'
import PostTypes from '~/types/post'
import Layout from '~/components/Layouts/Default'
import Hero from '~/components/Hero/Hero'

// Import Swiper styles if swiper used on page
import 'swiper/swiper.min.css'
import pageData from '../data/home/pageData'

const Highlights = dynamic(() => import('~/components/Highlights/index'))
const UseSupabaseTo = dynamic(() => import('~/components/UseSupabaseTo'))
const Products = dynamic(() => import('~/components/Products/index'))
const TimedTabsSection = dynamic(() => import('~/components/Sections/TimedTabsSection'))
// const HomepageMetricsSection = dynamic(() => import('components/Sections/HomepageMetricsSection'))
const DashboardFeatures = dynamic(() => import('components/DashboardFeatures/index'))
const ExampleAppsSection = dynamic(() => import('components/Sections/ExampleAppsSection'))
const CommunitySlider = dynamic(() => import('components/Sections/CommunitySlider'))
const EnterpriseCta = dynamic(() => import('~/components/Sections/EnterpriseCta'))
const CTABanner = dynamic(() => import('components/CTABanner/index'))

type Props = { customerStories: PostTypes[] }

const Index = ({ customerStories }: Props) => {
  return (
    <Layout>
      <Hero {...pageData.heroSection} />
      <Highlights {...pageData.highlightsSection} />
      <UseSupabaseTo {...pageData.useSupabaseTo} />
      {/* <HomepageMetricsSection /> */}
      <Products {...pageData.productsSection} />
      <DashboardFeatures {...pageData.dashboardFeatures} />
      <TimedTabsSection {...pageData.APIsection} />
      <ExampleAppsSection {...pageData.examplesSection} />
      <CommunitySlider {...pageData.quotesSection} />
      <EnterpriseCta />
      <CTABanner hasLogo />
    </Layout>
  )
}

export async function getStaticProps() {
  const customerStories = getSortedPosts('_customers', 3)

  return {
    props: {
      customerStories,
    },
  }
}

export default Index
