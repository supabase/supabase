import { getSortedPosts, getAllCategories } from '~/lib/posts'
import PostTypes from '~/types/post'
import Container from 'components/Container'
import Layout from '~/components/Layouts/Default'
import Hero from 'components/Hero/Hero'

import Features from 'components/Features/index'
import BuiltExamples from 'components/BuiltWithSupabase/index'
import MadeForDevelopers from 'components/MadeForDevelopers/index'
import AdminAccess from 'components/AdminAccess/index'
import CTABanner from 'components/CTABanner/index'
import CustomerStories from 'components/CustomerStories'
import TwitterSocialSection from '~/components/TwitterSocialSection'

// Import Swiper styles if swiper used on page
import 'swiper/swiper.min.css'

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
