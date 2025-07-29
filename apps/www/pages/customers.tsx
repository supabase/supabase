import fs from 'fs'

import { useRouter } from 'next/router'
import Head from 'next/head'

import { NextSeo } from 'next-seo'
import { generateRss } from '~/lib/rss'
import { getSortedPosts } from '~/lib/posts'

import DefaultLayout from '~/components/Layouts/Default'
import type PostTypes from '~/types/post'
import { motion } from 'framer-motion'
import styles from '~/styles/customers.module.css'
import Link from 'next/link'
import { GlassPanel } from 'ui-patterns/GlassPanel'
import CustomersFilters from '../components/CustomerStories/CustomersFilters'
import { useState } from 'react'
import { Button, cn } from 'ui'

export async function getStaticProps() {
  const allPostsData: any[] = getSortedPosts({ directory: '_customers' })
  const rss = generateRss(allPostsData)

  // create a rss feed in public directory
  // rss feed is added via <Head> component in render return
  fs.writeFileSync('./public/customers-rss.xml', rss)

  const industries = allPostsData.reduce<{ [key: string]: number }>(
    (acc, customer) => {
      // Increment the 'all' counter
      acc.all = (acc.all || 0) + 1

      // Increment the counter for each category
      customer.industry?.forEach((industry: string) => {
        acc[industry] = (acc[industry] || 0) + 1
      })

      return acc
    },
    { all: 0 }
  )

  const products = allPostsData.reduce<{ [key: string]: number }>(
    (acc, customer) => {
      // Increment the 'all' counter
      acc.all = (acc.all || 0) + 1

      // Increment the counter for each category
      customer.supabase_products?.forEach((product: string) => {
        acc[product] = (acc[product] || 0) + 1
      })

      return acc
    },
    { all: 0 }
  )

  return {
    props: {
      blogs: allPostsData,
      industries,
      products,
    },
  }
}

function CustomerStoriesPage(props: any) {
  const { basePath } = useRouter()
  const _allCustomers = props.blogs?.map((blog: PostTypes, idx: number) => {
    return {
      logo: blog.logo,
      logoInverse: blog.logo_inverse,
      name: blog.name,
      title: blog.title,
      link: blog.url,
      industry: blog.industry,
      products: blog.supabase_products,
    }
  })
  const [customers, setCustomers] = useState(_allCustomers)

  const meta = {
    title: 'Customer Stories | Supabase',
    image: `${basePath}/images/customers/og/customer-stories.jpg`,
    description:
      'See how Supabase empowers companies of all sizes to accelerate their growth and streamline their work.',
  }

  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta property="og:image" content={meta.image} />
        <meta name="twitter:image" content={meta.image} />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="RSS feed for customer stories"
          href={`${basePath}/customers-rss.xml`}
        />
      </Head>
      <NextSeo
        title={meta.title}
        description={meta.description}
        openGraph={{
          title: meta.title,
          description: meta.description,
          url: `${basePath}/customers`,
          images: [
            {
              url: meta.image,
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className="relative z-0 bg-background overflow-hidden">
          <div className="container mx-auto mt-28 sm:mt-44 px-4 xl:px-20">
            <div className="mx-auto relative z-10">
              <motion.div
                className="mx-auto sm:max-w-2xl text-center flex flex-col items-center mb-12"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5, easing: 'easeOut' } }}
              >
                <h1 className="text-foreground mb-3 text-3xl">Customer stories</h1>
                <h2 className="text-foreground-light text-base sm:text-xl">
                  Discover case studies on how Supabase is being used around the world to quickly
                  create outstanding products and set new industry standards.
                </h2>
              </motion.div>
              <CustomersFilters
                allCustomers={_allCustomers}
                setCustomers={setCustomers}
                industries={props.industries}
                products={props.products}
              />
              <div className="mx-auto mt-4 sm:mt-6 mb-12 md:mb-20 grid grid-cols-12 gap-6 not-prose">
                {customers?.length ? (
                  customers?.map((caseStudy: any, i: number) => (
                    <Link href={`${caseStudy.link}`} key={caseStudy.title} passHref legacyBehavior>
                      <motion.a
                        className="col-span-12 md:col-span-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: 0.4,
                            ease: [0.24, 0.25, 0.05, 1],
                            delay: 0.2 + i / 15,
                          },
                        }}
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
                  ))
                ) : (
                  <div className="col-span-12 flex flex-col gap-2 py-4 text-sm text-muted">
                    <p>No customers found</p>
                  </div>
                )}
              </div>
            </div>
            <div
              className={cn(
                'absolute inset-0 h-[150px] sm:h-[300px] bg-background z-0 after:!bg-background',
                styles['bg-visual']
              )}
            />
          </div>
        </div>
      </DefaultLayout>
    </>
  )
}

export default CustomerStoriesPage
