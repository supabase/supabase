import dynamic from 'next/dynamic'
import PostTypes from '~/types/post'
import { getSortedPosts } from '~/lib/posts'
import content from '~/data/home/content'
import Layout from '~/components/Layouts/Default'
import Hero from '~/components/Hero/Hero'

// Import Swiper styles if swiper used on page
import 'swiper/swiper.min.css'

const Products = dynamic(() => import('~/components/Products/index'))
const BuiltExamples = dynamic(() => import('components/BuiltWithSupabase/index'))
const MadeForDevelopers = dynamic(() => import('components/MadeForDevelopers/index'))
const AdminAccess = dynamic(() => import('components/AdminAccess/index'))
const CTABanner = dynamic(() => import('components/CTABanner/index'))
const CustomerStories = dynamic(() => import('components/CustomerStories'))
const TwitterSocialSection = dynamic(() => import('~/components/TwitterSocialSection'))

type Props = { customerStories: PostTypes[]; blogPosts: PostTypes[] }

const Index = ({ customerStories }: Props) => {
  return (
    <Layout>
      <Hero />
      <Products {...content.productsSection} />
      <TwitterSocialSection />
      <BuiltExamples />
      <MadeForDevelopers />
      <AdminAccess />
      <CustomerStories customerStories={customerStories} />
      <CTABanner />
    </Layout>
  )
}

export async function getStaticProps() {
  const customerStories = getSortedPosts({ directory: '_customers', limit: 3 })

  return {
    props: {
      customerStories,
    },
  }
}

export default Index
