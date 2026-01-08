import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'

import Layout from 'components/Layouts/Default'
import ProductHeader from 'components/Sections/ProductHeader2'
import SolutionsStickyNav from 'components/SolutionsStickyNav'
import useVibeCodersContent from 'data/solutions/vibe-coders'
import { Solutions } from 'data/Solutions'
import Quotes from '~/components/Solutions/Quotes'
import PostGrid from '~/components/Solutions/PostGrid'
import { getSortedPosts, type Post } from '~/lib/posts'
import SectionContainer from '~/components/Layouts/SectionContainer'
import AIBuildersLogos from 'components/Solutions/AIBuildersLogos'

const WhySupabase = dynamic(() => import('components/Solutions/FeaturesSection'))
const PlatformSection = dynamic(() => import('components/Solutions/PlatformSection'))
const PlatformStarterSection = dynamic(() => import('components/Solutions/TwoColumnsSection'))
const MPCSection = dynamic(() => import('components/Solutions/MPCSection'))

const VibeCodersPage: NextPage<{ posts: Post[] }> = ({ posts }) => {
  const content = useVibeCodersContent()

  return (
    <>
      <NextSeo
        title={content.metadata.metaTitle}
        description={content.metadata.metaDescription}
        openGraph={{
          title: content.metadata.metaTitle,
          description: content.metadata.metaDescription,
          url: `https://supabase.com/solutions/vibe-coders`,
        }}
      />
      <Layout className="overflow-visible">
        <SolutionsStickyNav activeItem={Solutions.vibeCoders} type="skill-based" />
        <ProductHeader
          {...content.heroSection}
          className="[&_h1]:2xl:!text-5xl bg-default border-0 lg:pb-16 [&_.ph-footer]:mt-0 [&_.ph-footer]:lg:mt-16 [&_.ph-footer]:xl:mt-32"
          sectionContainerClassName="lg:gap-4"
        />
        <Quotes {...content.quotes} />
        <WhySupabase {...content.why} />
        <PlatformSection {...content.platform} />
        <PlatformStarterSection {...content.platformStarterSection} />
        <MPCSection {...content.mcp} />
        <SectionContainer className="flex flex-col items-center gap-8">
          <h2 className="h3">
            Supabase is the backend platform for apps created by your favorite AI Builders.
          </h2>

          <AIBuildersLogos className="" />
        </SectionContainer>
        <PostGrid posts={posts} {...content.postGrid} />
      </Layout>
    </>
  )
}

export const getStaticProps = async () => {
  const posts = getSortedPosts({ directory: '_blog', limit: 6, tags: ['vibe-coding'] })
  return { props: { posts } }
}

export default VibeCodersPage
