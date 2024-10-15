import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { motion } from 'framer-motion'
import { Search, X as CloseIcon } from 'lucide-react'
import debounce from 'lodash/debounce'
import fs from 'fs'

import { useBreakpoint } from 'common'
import { Badge, Button, Checkbox, cn, Input } from 'ui'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import Panel from '~/components/Panel'

import { generateRss } from '~/lib/rss'
import { getSortedPosts } from '~/lib/posts'
import { features } from '~/data/features'

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

declare global {
  interface Array<T> {
    sortBy(property: keyof T): Array<T>
  }
}

Array.prototype.sortBy = function (property) {
  return this.sort((a, b) => {
    if (a[property] < b[property]) return -1
    if (a[property] > b[property]) return 1
    return 0
  })
}

const products = Array.from(new Set(features.flatMap((feature) => feature.products)))

function FeaturesPage() {
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

  // Group features by product
  const groupedFeatures = filteredFeatures.reduce(
    (acc, feature) => {
      feature.products.forEach((product) => {
        if (!acc[product]) acc[product] = []
        acc[product].push(feature)
      })
      return acc
    },
    {} as Record<string, typeof features>
  )

  const meta = {
    title: 'Supabase Features',
    image: `${basePath}/images/customers/og/customer-stories.jpg`,
    description:
      'Check out all the Supabase features. From authentication to storage, everything you need to build your next project.',
  }

  return (
    <>
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
        <SectionContainer className="border rounded-xl bg-alternative my-4 py-8">
          <div className="mx-auto relative z-10">
            <motion.div
              className="mx-auto sm:max-w-xl text-center flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, easing: 'easeOut' } }}
            >
              <h1 className="h1 text-foreground !m-0">Supabase Features</h1>
              <p className="text-foreground-light text-base sm:text-lg">
                Everything you need to build and ship your next project.
              </p>
            </motion.div>
          </div>
        </SectionContainer>
        <SectionContainer className="relative grid md:grid-cols-4 gap-4 !pt-0">
          <div className="relative w-full h-full">
            <div className="mb-4 flex flex-col gap-4 sticky top-20">
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
              <Button
                block
                type="dashed"
                onClick={() => {
                  setSelectedProducts([])
                  setSearchTerm('')
                }}
                className={cn(
                  'opacity-0 transition-opacity',
                  (selectedProducts.length || searchTerm.length) && 'opacity-100'
                )}
              >
                Clear all filters
              </Button>
            </div>
          </div>
          <div className="md:col-span-3 flex flex-col gap-4 md:gap-8">
            {!filteredFeatures?.length ? (
              <p className="text-foreground-lighter text-sm">
                No features found with these filters
              </p>
            ) : (
              Object.entries(groupedFeatures).map(([product, productFeatures]) => (
                <div key={product} className="flex flex-col gap-4 border-t pt-4">
                  <h2 className="text-foreground-light capitalize">{product}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {productFeatures.map((feature) => (
                      <Panel
                        key={feature.title}
                        hasActiveOnHover
                        innerClassName="flex flex-col justify-start items-stretch"
                      >
                        <Link
                          href={`/features/${feature.slug}`}
                          className="p-2 group cursor-pointer transition flex md:flex-col gap-3 sm:gap-2 h-full items-start"
                        >
                          <div className="relative rounded-lg min-h-[80px] max-h-[80px] md:max-h-[140px] h-full md:h-auto aspect-square md:w-full md:!aspect-video bg-alternative flex items-center justify-center shadow-inner border border-muted">
                            <feature.icon className="w-5 h-5 text-foreground-light group-hover:text-foreground transition-colors" />
                          </div>
                          <div className="md:p-3 md:pt-1 flex flex-col h-full md:h-auto flex-grow gap-0.5 md:gap-1.5 justify-center md:justify-start">
                            <h3 className="text-sm md:text-base text-foreground !leading-5">
                              {feature.title}
                            </h3>
                            <p className="text-foreground-light text-sm line-clamp-2">
                              {feature.subtitle}
                            </p>
                          </div>
                        </Link>
                      </Panel>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default FeaturesPage
