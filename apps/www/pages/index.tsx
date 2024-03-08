import dynamic from 'next/dynamic'
import { NextPage } from 'next'
import content from '~/data/home/content'
import { getStaticLatestPosts } from '~/lib/posts'
import PostTypes from '~/types/post'

import Layout from '~/components/Layouts/Default'
import Hero from '~/components/Hero/Hero'

const Products = dynamic(() => import('~/components/Products/index'))
const BuiltExamples = dynamic(() => import('components/BuiltWithSupabase/index'))
const MadeForDevelopers = dynamic(() => import('components/MadeForDevelopers/index'))
const AdminAccess = dynamic(() => import('components/AdminAccess/index'))
const CTABanner = dynamic(() => import('components/CTABanner/index'))
const CustomerStories = dynamic(() => import('components/CustomerStories'))
const TwitterSocialSection = dynamic(() => import('~/components/TwitterSocialSection'))
const ReactTooltip = dynamic(() => import('react-tooltip'), { ssr: false })

interface Props {
  latestPosts: PostTypes[]
}

const Index = ({ latestPosts }: NextPage & Props) => {
  return (
    <Layout latestPosts={latestPosts}>
      <Hero />
      <Products {...content.productsSection} />
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

export const getStaticProps = async () => getStaticLatestPosts()

export default Index
