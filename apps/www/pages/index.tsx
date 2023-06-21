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
const BuiltExamples = dynamic(() => import('components/BuiltWithSupabase/index'))
const TimedTabsSection = dynamic(() => import('~/components/Sections/TimedTabsSection'))
const MadeForDevelopers = dynamic(() => import('components/MadeForDevelopers/index'))
const AdminAccess = dynamic(() => import('components/AdminAccess/index'))
const CTABanner = dynamic(() => import('components/CTABanner/index'))
const CommunitySlider = dynamic(() => import('components/Sections/CommunitySlider'))
const CustomerStories = dynamic(() => import('components/CustomerStories'))
const TwitterSocialSection = dynamic(() => import('~/components/TwitterSocialSection'))

type Props = { customerStories: PostTypes[] }

const Index = ({ customerStories }: Props) => {
  return (
    <Layout>
      <Hero {...pageData.heroSection} />
      <Highlights {...pageData.highlightsSection} />
      <UseSupabaseTo {...pageData.useSupabaseTo} />
      <Products {...pageData.productsSection} />
      <TimedTabsSection {...pageData.APIsection} />
      {/* <TwitterSocialSection /> */}
      {/* <BuiltExamples /> */}
      {/* <MadeForDevelopers /> */}
      {/* <AdminAccess /> */}
      {/* <CustomerStories customerStories={customerStories} /> */}
      <CommunitySlider {...pageData.quotesSection} />
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
