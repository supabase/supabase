import dynamic from 'next/dynamic'
import { getSortedPosts } from '~/lib/posts'
import PostTypes from '~/types/post'
import Layout from '~/components/Layouts/Default'
import Hero from '~/components/Hero/Hero'

// Import Swiper styles if swiper used on page
import 'swiper/swiper.min.css'

const Features = dynamic(() => import('~/components/Features/index'))
const BackedBy = dynamic(() => import('~/components/BackedBy'))
const BuiltExamples = dynamic(() => import('components/BuiltWithSupabase/index'))
const MadeForDevelopers = dynamic(() => import('components/MadeForDevelopers/index'))
const AdminAccess = dynamic(() => import('components/AdminAccess/index'))
const CTABanner = dynamic(() => import('components/CTABanner/index'))
const CustomerStories = dynamic(() => import('components/CustomerStories'))
const TwitterSocialSection = dynamic(() => import('~/components/TwitterSocialSection'))

type Props = { customerStories: PostTypes[] }

const Index = ({ customerStories }: Props) => {
  return (
    <Layout>
      <Hero />
      <Features />
      <BackedBy className="pt-8 sm:pb-18 pb-16 md:pb-24 lg:pb-24" />
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
  const customerStories = getSortedPosts('_customers', 3)

  return {
    props: {
      customerStories,
    },
  }
}

export default Index
