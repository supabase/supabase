import { remarkCodeHike, type CodeHikeConfig } from '@code-hike/mdx'
import { CH } from '@code-hike/mdx/components'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { type GetStaticPaths, type GetStaticProps } from 'next'
import type { SerializeResult as MDXRemoteSerializeResult } from 'next-mdx-remote-client'
import { MDXClient } from 'next-mdx-remote-client/csr'
import { serialize } from 'next-mdx-remote-client/serialize'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { useState, type Dispatch, type SetStateAction } from 'react'
import remarkGfm from 'remark-gfm'

import 'swiper/css'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { getPartner, listPartnerSlugs } from '~/lib/marketplaceDb'
import { type Partner } from '~/types/partners'
import { useBreakpoint } from 'common'
import codeHikeTheme from 'config/code-hike.theme.json' with { type: 'json' }
import { Swiper, SwiperSlide } from 'swiper/react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { ExpandableVideo } from 'ui-patterns/ExpandableVideo'

import Error404 from '../../404'

/**
 * Returns custom components so that the markdown converts to a nice looking html.
 */
function mdxComponents(callback: Dispatch<SetStateAction<string | null>>) {
  const components = {
    CH,
    Admonition,
    /**
     * Returns a custom img element which has a bound onClick listener. When the image is clicked, it will open a modal showing that particular image.
     */
    img: (
      props: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>
    ) => {
      return <img {...props} onClick={() => callback(props.src!.toString())} />
    },
  }

  return components
}

type PartnerData = {
  partner: Partner
  overview: MDXRemoteSerializeResult<Record<string, unknown>, Record<string, unknown>>
}

function Partner({ partner, overview }: PartnerData) {
  const [focusedImage, setFocusedImage] = useState<string | null>(null)
  const isNarrow = useBreakpoint('lg')

  if (!partner) return <Error404 />

  return (
    <>
      <NextSeo
        title={`${partner.title} | Works With Supabase`}
        description={partner.description}
        openGraph={{
          title: `${partner.title} | Works With Supabase`,
          description: partner.description,
          url: `https://supabase.com/partners/catalog/${partner.slug}`,
          images: [
            {
              url: partner.images ? partner.images[0] : partner.logo,
            },
          ],
        }}
      />

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
              className="relative w-full max-w-6xl aspect-[16/8] rounded-md border bg-muted"
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
        <SectionContainer>
          <div className="col-span-12 mx-auto mb-2 max-w-5xl lg:col-span-2">
            {/* Back button */}
            <Link
              href="/partners/catalog"
              className="text-foreground hover:text-foreground-lighter flex cursor-pointer items-center transition-colors"
            >
              <ChevronLeft width={14} height={14} />
              Back
            </Link>

            <div className="flex mt-6 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <Image
                  layout="fixed"
                  width={56}
                  height={56}
                  className="bg-surface-200 shrink-f0 h-14 w-14 rounded-full border"
                  src={partner.logo}
                  alt={partner.title}
                />
                <h1 className="h1" style={{ marginBottom: 0 }}>
                  {partner.title}
                </h1>
              </div>
              {partner.installUrl && (
                <Button asChild size="medium">
                  <a href={partner.installUrl} target="_blank" rel="noreferrer">
                    Add integration
                  </a>
                </Button>
              )}
            </div>

            <div
              className="bg-linear-to-t from-background-alternative to-background border-b p-6 [&_.swiper]:!overflow-visible [&_.swiper-wrapper]:!overflow-visible"
              style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}
            >
              {(partner.images?.length ?? 0) > 0 && (
                <SectionContainer className="py-0! px-3! lg:px-12! xl:p-0! mx-auto max-w-5xl mt-32">
                  <Swiper
                    initialSlide={0}
                    spaceBetween={20}
                    slidesPerView={4}
                    speed={300}
                    grabCursor
                    centeredSlides={false}
                    centerInsufficientSlides={false}
                    breakpoints={{
                      320: {
                        slidesPerView: 1.15,
                        centeredSlides: false,
                        spaceBetween: 10,
                      },
                      720: {
                        slidesPerView: 1.75,
                        centeredSlides: false,
                        spaceBetween: 10,
                      },
                      920: {
                        slidesPerView: 2.5,
                        centeredSlides: false,
                      },
                      1024: {
                        slidesPerView: 3,
                      },
                      1280: {
                        slidesPerView: 4,
                      },
                    }}
                  >
                    {partner.images?.map((image: any, i: number) => {
                      return (
                        <SwiperSlide key={i}>
                          <div className="relative aspect-[16/8]">
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
                      )
                    })}
                  </Swiper>
                </SectionContainer>
              )}
            </div>

            <div className="grid gap-y-12 lg:grid-cols-8 lg:gap-x-20 mt-16">
              {isNarrow && <PartnerDetails partner={partner} />}

              <div className="lg:col-span-5 overflow-hidden">
                <h2
                  className="text-foreground"
                  style={{ fontSize: '1.5rem', marginBottom: '1rem' }}
                >
                  Overview
                </h2>

                <div className="prose">
                  {'error' in overview ? (
                    <p>Error rendering integration page: {overview.error.message}</p>
                  ) : (
                    // @ts-expect-error: Gildas - This is because CodeHide put its components under the CH namespace. It works but the MDXClient types are stricter
                    <MDXClient {...overview} components={mdxComponents(setFocusedImage)} />
                  )}
                </div>
              </div>

              {!isNarrow && <PartnerDetails partner={partner} />}
            </div>
            {partner.installUrl && (
              <div className="bg-background hover:border-default-control border-default rounded-2xl border p-10 drop-shadow-xs max-w-5xl mx-auto mt-12">
                <div className="flex flex-row justify-between">
                  <h1 className="text-2xl self-center">
                    Get started with {partner.title} and Supabase.
                  </h1>
                  <a href={partner.installUrl} target="_blank" rel="noreferrer">
                    <Button size="medium" type="secondary">
                      Add integration
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

const PartnerDetails = ({ partner }: { partner: Partner }) => {
  const videoThumbnail = partner.youtubeId
    ? `https://img.youtube.com/vi/${partner.youtubeId}/0.jpg`
    : undefined

  return (
    <div className="lg:col-span-3">
      <div className="sticky top-20 flex flex-col gap-4">
        <h2 className="text-foreground" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          Details
        </h2>

        {partner.youtubeId && (
          <ExpandableVideo
            videoId={partner.youtubeId}
            // imgUrl={videoThumbnail}
            imgOverlayText="Watch an introductory video"
            triggerContainerClassName="w-full"
          />
        )}

        <div className="text-foreground divide-y">
          {partner.type === 'technology' && (
            <div className="flex items-center justify-between py-2">
              <span className="text-foreground-lighter">Developer</span>
              <span className="text-foreground">{partner.partnerName}</span>
            </div>
          )}

          {partner.categories.map((category) => (
            <div key={category.slug} className="flex items-center justify-between py-2">
              <span className="text-lighter">Category</span>
              <Link
                href={`/partners/catalog#${category.slug}`}
                className="text-brand-link hover:underline transition-colors"
              >
                {category.name}
              </Link>
            </div>
          ))}

          <div className="flex items-center justify-between py-2">
            <span className="text-foreground-lighter">Website</span>
            <a
              href={partner.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-brand-link hover:underline transition-colors"
            >
              {new URL(partner.websiteUrl).host}
            </a>
          </div>

          {partner.type === 'technology' && partner.docsUrl && (
            <div className="flex items-center justify-between py-2">
              <span className="text-foreground-lighter">Documentation</span>
              <a
                href={partner.docsUrl}
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

// This function gets called at build time
export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await listPartnerSlugs()

  const paths: {
    params: { slug: string }
    locale?: string | undefined
  }[] =
    slugs?.map((slug) => ({
      params: {
        slug,
      },
    })) ?? []

  return {
    paths,
    fallback: 'blocking',
  }
}

// This also gets called at build time
export const getStaticProps: GetStaticProps<PartnerData> = async ({ params }) => {
  const partner = await getPartner(params!.slug as string)

  if (!partner) {
    return {
      notFound: true,
    }
  }

  const codeHikeOptions: CodeHikeConfig = {
    theme: codeHikeTheme,
    lineNumbers: true,
    showCopyButton: true,
    skipLanguages: [],
    autoImport: false,
  }

  // Parse markdown
  const overview = await serialize({
    source: partner.content,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, [remarkCodeHike, codeHikeOptions]],
      },
    },
  })

  return {
    props: { partner, overview },
    revalidate: 1800, // 30 minutes
  }
}

export default Partner
