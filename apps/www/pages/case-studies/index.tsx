import fs from 'fs'
import { useEffect, useState } from 'react'

import { useRouter } from 'next/router'
import Head from 'next/head'

import { NextSeo } from 'next-seo'
import { generateRss } from '~/lib/rss'
import { getSortedPosts, getAllCategories } from '~/lib/posts'
import authors from 'lib/authors.json'

import DefaultLayout from '~/components/Layouts/Default'
import { Typography, Badge, Space, Select } from '@supabase/ui'
import PostTypes from '~/types/post'
import BlogListItem from '~/components/Blog/BlogListItem'
import BlogHeader from '~/components/Blog/BlogHeader'
import { motion } from 'framer-motion'
import styles from './case-studies.module.css'
import Link from 'next/link'
import { GlassPanel } from 'ui'

export async function getStaticProps() {
  const allPostsData = getSortedPosts('_case-studies')
  const categories = getAllCategories('_case-studies')
  const rss = generateRss(allPostsData)

  // create a rss feed in public directory
  // rss feed is added via <Head> component in render return
  fs.writeFileSync('./public/case-studies-rss.xml', rss)

  return {
    props: {
      blogs: allPostsData,
      categories,
    },
  }
}

function Blog(props: any) {
  const [category, setCategory] = useState('all')
  const [blogs, setBlogs] = useState(props.blogs)
  const { basePath } = useRouter()

  useEffect(() => {
    // Update the document title using the browser API
    setBlogs(
      category === 'all'
        ? props.blogs
        : props.blogs.filter((post: any) => {
            const found = post.tags.includes(category)
            return found
          })
    )
  }, [category])

  const caseStudyThumbs = blogs.map((blog: PostTypes, idx: number) => {
    return {
      logo: blog.logo,
      logoInverse: blog.logo_inverse,
      title: blog.title,
      link: blog.url,
    }
  })

  return (
    <>
      <Head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="RSS feed for case studies"
          href={`${basePath}/case-studies-rss.xml`}
        />
      </Head>
      <NextSeo title="Case studies" description="Latest customers using Supabase" />
      <DefaultLayout>
        <div className="relative z-0 dark:bg-scale-200 bg-scale-200 overflow-hidden">
          <div className="container mx-auto mt-44 px-8 sm:px-4 xl:px-20">
            <div className="mx-auto relative z-10">
              <motion.div
                className="mx-auto max-w-2xl text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5, easing: 'easeOut' } }}
              >
                <h1 className="text-scale-1200 mb-3 text-3xl">Case studies</h1>
                <h2 className="text-scale-1100 text-xl">
                  Discover how supabase is being used around the world to quickly create outstanding
                  products and set new industry standards.
                </h2>
              </motion.div>
              <div className="mx-auto my-12 md:my-20 grid grid-cols-12 gap-6 not-prose">
                {caseStudyThumbs.map((caseStudy: any, i: number) => (
                  <Link href={`${caseStudy.link}`} key={caseStudy.title} passHref>
                    <motion.a
                      className="col-span-12 md:col-span-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.2 + i / 10 } }}
                    >
                      <GlassPanel
                        {...caseStudy}
                        background={true}
                        showIconBg={true}
                        showLink={true}
                        hasLightIcon
                      >
                        {caseStudy.description}
                      </GlassPanel>
                    </motion.a>
                  </Link>
                ))}
              </div>
            </div>
            <div
              className={[
                'absolute inset-0 h-[300px] dark:bg-scale-200 bg-bg-scale-200 z-0 after:!bg-scale-200',
                styles['bg-visual'],
              ].join(' ')}
            />
          </div>
        </div>
      </DefaultLayout>
    </>
  )
}

export default Blog
