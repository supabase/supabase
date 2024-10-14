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
import { Badge, Button, Checkbox, Input } from 'ui'
import { Search, X as CloseIcon } from 'lucide-react'
import debounce from 'lodash/debounce'

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

  // Debounced function to update URL params
  const updateQueryParamsDebounced = useCallback(
    debounce(() => {
      const params = new URLSearchParams()
      if (searchTerm) params.set('q', searchTerm)
      if (selectedProducts.length > 0) params.set('products', selectedProducts.join(','))

      router.replace({ pathname: '/features', query: params.toString() }, undefined, {
        shallow: true,
      })
    }, 300),
    [searchTerm, selectedProducts]
  )

  useEffect(() => {
    updateQueryParamsDebounced()
    return updateQueryParamsDebounced.cancel // Cleanup on unmount
  }, [searchTerm, selectedProducts, updateQueryParamsDebounced])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Handle product checkbox change
  const handleProductChange = (product: string) => {
    setSelectedProducts((prev) =>
      prev.includes(product) ? prev.filter((p) => p !== product) : [...prev, product]
    )
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
            <h2 className="text-sm">Filter by Products:</h2>
            <div className="flex flex-col gap-2">
              {products.map((product) => (
                <button
                  key={product}
                  className="flex items-center mb-1 text-foreground-light hover:text-foreground !cursor-pointer transition-colors"
                >
                  <Checkbox
                    id={product}
                    checked={selectedProducts.includes(product)}
                    onChange={() => handleProductChange(product)}
                  />
                  <label
                    htmlFor={product}
                    className="text-sm leading-none capitalize flex-1 text-left"
                  >
                    {product}
                  </label>
                </button>
              ))}
            </div>
            <div className="text-foreground-lighter text-xs">
              Features found: {filteredFeatures.length}
            </div>
          </div>
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFeatures.map((feature) => (
              <Panel key={feature.title} hasActiveOnHover>
                <Link
                  href={`/features/${feature.slug}`}
                  className="p-2 md:p-4 cursor-pointer transition flex md:flex-col gap-3 sm:gap-4"
                >
                  <div className="relative rounded-lg min-h-[80px] h-full aspect-square md:w-full md:aspect-video bg-alternative flex items-center justify-center">
                    <div className="absolute right-3 top-3 hidden md:flex gap-0.5">
                      {feature.products.map((product) => (
                        <Badge key={product} className="text-xs text-foreground-light capitalize">
                          {product}
                        </Badge>
                      ))}
                    </div>
                    <feature.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex flex-col gap-1 justify-center">
                    <h3 className="text-sm md:text-base text-foreground leading-5">
                      {feature.title}
                    </h3>
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
