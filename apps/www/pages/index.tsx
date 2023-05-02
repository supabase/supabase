import dynamic from 'next/dynamic'
import { getSortedPosts } from '~/lib/posts'
import PostTypes from '~/types/post'
import Container from '~/components/Container'
import Layout from '~/components/Layouts/Default'
import Hero from '~/components/Hero/Hero'

// Import Swiper styles if swiper used on page
import 'swiper/swiper.min.css'

const Features = dynamic(() => import('components/Features/index'))
const BuiltExamples = dynamic(() => import('components/BuiltWithSupabase/index'))
const MadeForDevelopers = dynamic(() => import('components/MadeForDevelopers/index'))
const AdminAccess = dynamic(() => import('components/AdminAccess/index'))
const CTABanner = dynamic(() => import('components/CTABanner/index'))
const CustomerStories = dynamic(() => import('components/CustomerStories'))
const TwitterSocialSection = dynamic(() => import('~/components/TwitterSocialSection'))

type Props = { customerStories: PostTypes[] }

const Index = ({ customerStories }: Props) => {
  return (
    <>
      <Layout>
        <Container>
          <Hero />
          <Features />
          <TwitterSocialSection />
          <BuiltExamples />
          <MadeForDevelopers />
          <AdminAccess />
          <CustomerStories customerStories={customerStories} />
          <CTABanner />
        </Container>
      </Layout>
    </>
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
