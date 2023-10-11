import dynamic from 'next/dynamic'
import PostTypes from '~/types/post'
import { getSortedPosts } from '~/lib/posts'
import content from '~/data/home/content'
import Layout from '~/components/Layouts/Default'
import Hero from '~/components/Hero/Hero'

// Import Swiper styles if swiper used on page
import 'swiper/swiper.min.css'
import supabase from '../lib/supabase'

const AdminAccess = dynamic(() => import('components/AdminAccess/index'))
const BuiltExamples = dynamic(() => import('components/BuiltWithSupabase/index'))
const CTABanner = dynamic(() => import('components/CTABanner/index'))
const CustomerStories = dynamic(() => import('components/CustomerStories'))
const Integrations = dynamic(() => import('~/components/Sections/Integrations'))
const MadeForDevelopers = dynamic(() => import('components/MadeForDevelopers/index'))
const Products = dynamic(() => import('~/components/Products/index'))
const TwitterSocialSection = dynamic(() => import('~/components/TwitterSocialSection'))

type Props = { customerStories: PostTypes[]; blogPosts: PostTypes[]; integrations: any[] }

const Index = ({ customerStories, integrations }: Props) => {
  return (
    <Layout>
      <Hero />
      <Products {...content.productsSection} />
      <TwitterSocialSection />
      <BuiltExamples />
      <MadeForDevelopers />
      <AdminAccess />
      <Integrations {...content.integrations} integrations={integrations} />
      <CustomerStories customerStories={customerStories} />
      <CTABanner />
    </Layout>
  )
}

export async function getStaticProps() {
  const customerStories = getSortedPosts({ directory: '_customers', limit: 3 })
  const { data: integrations } = await supabase
    .from('partners')
    .select('*')
    .eq('approved', true)
    .eq('type', 'technology')
    .order('category')
    .order('title')
    .limit(10)

  return {
    props: {
      customerStories,
      integrations,
    },
  }
}

export default Index
