import fs from 'fs'
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { NextSeo } from 'next-seo'
import { generateRss } from '~/lib/rss'
import { getSortedPosts } from '~/lib/posts'
import DefaultLayout from '~/components/Layouts/Default'
import type PostTypes from '~/types/post'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { GlassPanel } from 'ui-patterns/GlassPanel'
import EventCallout from '../components/EventCallout'
import { useBreakpoint } from 'common'
import SectionContainer from '../components/Layouts/SectionContainer'
import { FeatureProductType, features } from '~/data/features'
import Panel from '../components/Panel'
import { Button, Checkbox, Input } from 'ui'
import { Search, X as CloseIcon } from 'lucide-react'

export async function getStaticProps() {
  const allPostsData = getSortedPosts({ directory: '_customers' })
  const rss = generateRss(allPostsData)
  fs.writeFileSync('./public/customers-rss.xml', rss)

  return {
    props: {
      blogs: allPostsData,
    },
  }
}

const products = Array.from(new Set(features.flatMap((feature) => feature.products)))

function FeaturesPage(props: any) {
  const router = useRouter()
  const { basePath, query } = router
  const isMobile = useBreakpoint(1023)
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>((query.q as string) || '')
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    (query.products as string)?.split(',') || []
  )

  // Update state based on URL parameters only on initial load
  useEffect(() => {
    if (query.q) setSearchTerm(query.q as string)
    if (query.products) setSelectedProducts((query.products as string).split(',') || [])
  }, [query.q, query.products])

  const updateQueryParams = useCallback(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('q', searchTerm)
    if (selectedProducts.length > 0) params.set('products', selectedProducts.join(','))

    router.replace({ pathname: '/features', query: params.toString() }, undefined, {
      shallow: true,
    })
  }, [router, searchTerm, selectedProducts])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    updateQueryParams() // Update URL as soon as search term changes
  }

  // Handle product checkbox change
  const handleProductChange = (product: string) => {
    setSelectedProducts((prev) =>
      prev.includes(product) ? prev.filter((p) => p !== product) : [...prev, product]
    )
    updateQueryParams() // Update URL as soon as selected products change
  }

  // Filter features based on search term and selected products
  const filteredFeatures = features.filter((feature) => {
    const matchesSearch =
      feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesProduct =
      selectedProducts.length === 0 ||
      feature.products.some((product) => selectedProducts.includes(product))

    return matchesSearch && matchesProduct
  })

  const meta = {
    title: 'Supabase Features',
    image: `${basePath}/images/customers/og/customer-stories.jpg`,
    description:
      'Check out all the features that Supabase has to offer. From authentication to storage, everything you need to build your next project.',
  }

  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
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
          images: [{ url: meta.image }],
        }}
      />
      <DefaultLayout>
        <SectionContainer>
          <div className="mx-auto relative z-10">
            <motion.div
              className="mx-auto sm:max-w-2xl text-center flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, easing: 'easeOut' } }}
            >
              <h1 className="h1 text-foreground mb-3 text-3xl">Features</h1>
              <p className="text-foreground-light text-base sm:text-xl">
                Everything you need to build your next project
              </p>
            </motion.div>
          </div>
        </SectionContainer>
        <SectionContainer className="grid md:grid-cols-4 gap-4 !pt-0">
          <div className="mb-4 flex flex-col gap-4">
            <Input
              icon={<Search size="14" />}
              size="small"
              autoComplete="off"
              type="search"
              placeholder="Search features"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full"
              actions={
                isMobile && (
                  <Button
                    type="link"
                    onClick={() => {
                      setSearchTerm('')
                      setShowSearchInput(false)
                    }}
                    className="text-foreground-light hover:text-foreground hover:bg-selection"
                  >
                    <CloseIcon size="14" />
                  </Button>
                )
              }
            />
            <h2 className="font-semibold mb-2">Filter by Products:</h2>
            <div className="flex flex-col gap-2">
              {products.map((product) => (
                <div key={product} className="flex items-center mb-1">
                  <Checkbox
                    id={product}
                    checked={selectedProducts.includes(product)}
                    onChange={() => handleProductChange(product)}
                    className="mr-2"
                  />
                  <label htmlFor={product} className="text-sm font-medium leading-none">
                    {product}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredFeatures.map((feature) => (
              <Panel key={feature.title} hasActiveOnHover>
                <Link
                  href={`/features/${feature.slug}`}
                  className="p-4 cursor-pointer transition flex flex-col gap-4"
                >
                  <div className="relative w-full rounded-lg aspect-video bg-alternative flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h2 className="text-foreground">{feature.title}</h2>
                    <p className="text-foreground-light text-sm">{feature.subtitle}</p>
                  </div>
                </Link>
              </Panel>
            ))}
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default FeaturesPage
