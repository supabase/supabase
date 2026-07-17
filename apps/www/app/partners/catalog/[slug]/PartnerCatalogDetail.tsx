'use client'

import 'swiper/css'

import { CH } from '@code-hike/mdx/components'
import DefaultLayout from '~/components/Layouts/Default'
import { type ListingDetail, type Partner } from '~/types/partners'
import { useBreakpoint } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, ChevronLeft, ExternalLink } from 'lucide-react'
import type { SerializeResult as MDXRemoteSerializeResult } from 'next-mdx-remote-client'
import { MDXClient } from 'next-mdx-remote-client/csr'
import Image from 'next/image'
import Link from 'next/link'
import { useQueryState } from 'nuqs'
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Button, cn } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { ExpandableVideo } from 'ui-patterns/ExpandableVideo'

import SectionContainerWithCn from '@/components/Layouts/SectionContainerWithCn'

function mdxComponents(callback: Dispatch<SetStateAction<string | null>>) {
  return {
    CH,
    Admonition,
    img: (
      props: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>
    ) => <img {...props} onClick={() => callback(props.src!.toString())} />,
  }
}

type Props = {
  partner: Partner
  serializedListings: MDXRemoteSerializeResult<Record<string, unknown>, Record<string, unknown>>[]
}

export default function PartnerCatalogDetail({ partner, serializedListings }: Props) {
  const [focusedImage, setFocusedImage] = useState<string | null>(null)
  const isNarrow = useBreakpoint('lg')
  const tabsRef = useRef<HTMLDivElement>(null)
  const [showStickyBar, setShowStickyBar] = useState(false)

  useEffect(() => {
    const tabsEl = tabsRef.current
    if (!tabsEl) return

    // Sticky bar sticks at top-16 (4rem), so show it once the tabs scroll past that point.
    const handleScroll = () => setShowStickyBar(tabsEl.getBoundingClientRect().bottom <= 64)

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Computed before the hook so the first slug can seed the default value.
  const allListings: ListingDetail[] = partner.listings?.length
    ? partner.listings
    : [
        {
          slug: partner.slug,
          label: 'Overview',
          publishedInMarketplace: false,
          content: partner.content,
          installUrl: partner.installUrl,
          docsUrl: partner.docsUrl,
          images: partner.images,
          youtubeId: partner.youtubeId,
        },
      ]

  const [activeSlug, setActiveSlug] = useQueryState('tab', {
    defaultValue: allListings[0]?.slug ?? '',
    history: 'replace',
  })

  const activeListing = allListings.find((l) => l.slug === activeSlug) ?? allListings[0]
  const activeTabIndex = allListings.indexOf(activeListing)
  const activeOverview = serializedListings[activeTabIndex] ?? serializedListings[0]
  // Marketplace integrations link to the Supabase dashboard; others use installUrl if provided.
  const INSTALL_HREF_BLOCKLIST = ['aikido-security', 'stripe-sync-engine']
  const installHref = INSTALL_HREF_BLOCKLIST.includes(partner.slug)
    ? undefined
    : activeListing.publishedInMarketplace
      ? activeListing.dashboardUrl
      : activeListing.installUrl

  return (
    <>
      <AnimatePresence>
        {focusedImage && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8 cursor-zoom-out"
            onClick={() => setFocusedImage(null)}
          >
            <motion.div
              layoutId={`partner-image-${focusedImage}`}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="relative w-full  aspect-16/8 rounded-md border bg-muted"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={focusedImage}
                alt={partner.title}
                fill
                sizes="80vw"
                className="rounded-md object-cover"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DefaultLayout>
        <div className="relative h-auto w-full">
          <SectionContainerWithCn height="narrow" className="col-span-12 lg:col-span-2">
            {/* Back button */}
            <Link
              href="/partners/catalog"
              className="text-foreground-lighter hover:text-foreground text-sm flex cursor-pointer items-center transition-colors gap-1"
            >
              <ChevronLeft width={14} height={14} />
              Partner Catalog
            </Link>

            {/* Partner header */}
            <div className="flex mt-6 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <Image
                  width={56}
                  height={56}
                  className="bg-white p-1 shrink-0 h-14 w-14 rounded-full border"
                  src={partner.logo}
                  alt={partner.title}
                />
                <h1 className="h1 mb-0!">{partner.title}</h1>
              </div>
              {installHref && (
                <Button asChild size="medium" iconRight={<ArrowUpRight strokeWidth={1.5} />}>
                  <a href={installHref} target="_blank" rel="noreferrer">
                    {activeListing.publishedInMarketplace
                      ? 'Install integration'
                      : 'Add integration'}
                  </a>
                </Button>
              )}
            </div>
          </SectionContainerWithCn>
          <div className="border-b">
            <SectionContainerWithCn
              height="none"
              className="overflow-x-scroll overflow-y-hidden"
              ref={tabsRef}
            >
              {/* Listings tabs */}
              <div className="flex">
                {allListings.map((listing, i) => (
                  <button
                    key={listing.slug}
                    type="button"
                    onClick={() => {
                      setActiveSlug(listing.slug)
                      setFocusedImage(null)
                    }}
                    className={cn(
                      'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap hover:cursor-pointer',
                      activeTabIndex === i
                        ? 'border-foreground text-foreground'
                        : 'border-transparent text-foreground-lighter hover:text-foreground'
                    )}
                  >
                    {listing.label}
                  </button>
                ))}
              </div>
            </SectionContainerWithCn>
          </div>

          {/* Images for active listing */}
          {(activeListing.images?.length ?? 0) > 0 && (
            <div className="bg-linear-to-t overflow-hidden from-background-alternative to-background border-b py-6 [&_.swiper]:overflow-visible! [&_.swiper-wrapper]:overflow-visible!">
              <SectionContainerWithCn height="none" className="">
                <Swiper
                  initialSlide={0}
                  spaceBetween={20}
                  slidesPerView={4}
                  speed={300}
                  grabCursor
                  centeredSlides={false}
                  centerInsufficientSlides={false}
                  breakpoints={{
                    320: { slidesPerView: 1.45, centeredSlides: false, spaceBetween: 10 },
                    720: { slidesPerView: 1.75, centeredSlides: false, spaceBetween: 10 },
                    920: { slidesPerView: 2.5, centeredSlides: false },
                    1024: { slidesPerView: 3 },
                    1280: { slidesPerView: 4 },
                  }}
                >
                  {activeListing.images?.map((image, i) => (
                    <SwiperSlide key={i}>
                      <div className="relative aspect-16/8">
                        <AnimatePresence>
                          {focusedImage !== image && (
                            <motion.div
                              key={`thumb-${image}`}
                              layoutId={`partner-image-${image}`}
                              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                              className="absolute inset-0 cursor-zoom-in rounded-md border bg-muted"
                              onClick={() => setFocusedImage(image)}
                            >
                              <Image
                                placeholder="blur"
                                blurDataURL="/images/blur.png"
                                fill
                                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 920px) 40vw, (min-width: 720px) 60vw, 90vw"
                                src={image}
                                alt={partner.title}
                                className="rounded-md object-cover"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </SectionContainerWithCn>
            </div>
          )}

          {/* Main content */}
          <SectionContainerWithCn height="narrow">
            <div className="grid gap-y-12 lg:grid-cols-8 lg:gap-x-20">
              {isNarrow && <PartnerDetails partner={partner} activeListing={activeListing} />}

              <div className="lg:col-span-5 overflow-hidden">
                <h2
                  className="text-foreground"
                  style={{ fontSize: '1.5rem', marginBottom: '1rem' }}
                >
                  Overview
                </h2>

                <div className="prose">
                  {'error' in activeOverview ? (
                    <p>Error rendering integration page: {activeOverview.error.message}</p>
                  ) : (
                    // @ts-expect-error: CodeHike puts its components under the CH namespace
                    <MDXClient {...activeOverview} components={mdxComponents(setFocusedImage)} />
                  )}
                </div>
              </div>

              {!isNarrow && <PartnerDetails partner={partner} activeListing={activeListing} />}
            </div>
          </SectionContainerWithCn>
          <div className="absolute h-full w-full inset-0 z-20 pointer-events-none">
            <div
              className={cn(
                'transition-all border-b bg-background/90 -translate-y-3/4 dark:bg-background/95 backdrop-blur-xs sticky top-16 z-20',
                showStickyBar
                  ? 'opacity-100 pointer-events-auto translate-y-0'
                  : 'opacity-0 pointer-events-none'
              )}
            >
              <SectionContainerWithCn
                height="none"
                className="flex justify-between items-center gap-4 py-2"
              >
                <div className="flex items-center space-x-2">
                  <Image
                    width={56}
                    height={56}
                    className="hidden sm:block bg-white p-0.5 shrink-0 h-6 w-6 rounded-full border"
                    src={partner.logo}
                    alt={partner.title}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
                    <span className="sm:text-lg truncate">{partner.title}</span>
                    {activeListing && (
                      <>
                        <span className="text-foreground-lighter text-sm hidden sm:inline">—</span>
                        <span className="text-foreground-lighter text-sm truncate">
                          {activeListing.label}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {installHref && (
                  <Button asChild>
                    <a href={installHref} target="_blank" rel="noreferrer">
                      {activeListing.publishedInMarketplace
                        ? 'Install integration'
                        : 'Add integration'}
                    </a>
                  </Button>
                )}
              </SectionContainerWithCn>
            </div>
          </div>
        </div>

        <div className="border-t bg-background">
          <SectionContainerWithCn className="mx-auto max-w-2xl flex flex-col items-center gap-6 py-24 px-6 text-center">
            <h2 className="h2 text-balance">Interested in partnering with Supabase?</h2>
            <Button asChild size="medium">
              <Link href="/partners#become-a-partner">Become a partner</Link>
            </Button>
          </SectionContainerWithCn>
        </div>
      </DefaultLayout>
    </>
  )
}

function PartnerDetails({
  partner,
  activeListing,
}: {
  partner: Partner
  activeListing: ListingDetail
}) {
  return (
    <div className="lg:col-span-3">
      <div className="sticky top-32 flex flex-col gap-4">
        <h2 className="text-foreground font-mono uppercase tracking-wide text-xs">Details</h2>

        {activeListing.youtubeId && (
          <ExpandableVideo
            videoId={activeListing.youtubeId}
            imgUrl={`https://img.youtube.com/vi/${activeListing.youtubeId}/0.jpg`}
            imgOverlayText="Watch an introductory video"
            triggerContainerClassName="w-full"
          />
        )}

        <div className="text-foreground divide-y text-sm">
          {partner.type === 'technology' && (
            <div className="flex items-center justify-between py-1.5 md:py-2">
              <span className="text-foreground-lighter">Developer</span>
              <span className="text-foreground">{partner.builtBy}</span>
            </div>
          )}

          {partner.categories.map((category) => (
            <div key={category.slug} className="flex items-center justify-between py-1.5 md:py-2">
              <span className="text-lighter">Category</span>
              <Link
                href={`/partners/catalog?cat=${encodeURIComponent(category.slug)}`}
                className="text-brand-link hover:underline transition-colors"
              >
                {category.name}
              </Link>
            </div>
          ))}

          {partner.websiteUrl && (
            <div className="flex items-center justify-between py-1.5 md:py-2">
              <span className="text-foreground-lighter">Website</span>
              <a
                href={
                  partner.websiteUrl.startsWith('http')
                    ? partner.websiteUrl
                    : `https://${partner.websiteUrl}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-brand-link hover:underline transition-colors"
              >
                {(() => {
                  try {
                    const url = partner.websiteUrl.startsWith('http')
                      ? partner.websiteUrl
                      : `https://${partner.websiteUrl}`
                    return new URL(url).host
                  } catch {
                    return partner.websiteUrl
                  }
                })()}
              </a>
            </div>
          )}

          {partner.type === 'technology' && activeListing.docsUrl && (
            <div className="flex items-center justify-between py-1.5 md:py-2">
              <span className="text-foreground-lighter">Documentation</span>
              <a
                href={activeListing.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand-link hover:underline transition-colors"
              >
                <span className="flex items-center space-x-1">
                  <span>Learn</span>
                  <ExternalLink width={14} height={14} />
                </span>
              </a>
            </div>
          )}
        </div>
        <p className="text-foreground-light text-sm">
          Third-party integrations and docs are managed by Supabase partners.
        </p>
      </div>
    </div>
  )
}
