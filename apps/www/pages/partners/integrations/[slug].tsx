import { CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import { CH } from '@code-hike/mdx/components'
import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }
import { GetStaticPaths, GetStaticProps } from 'next'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { Dispatch, SetStateAction, useState } from 'react'
import remarkGfm from 'remark-gfm'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/swiper.min.css'
import { Admonition, Button, ExpandableVideo, IconChevronLeft, IconExternalLink } from 'ui'
import ImageModal from '~/components/ImageModal'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import supabase from '~/lib/supabaseMisc'
import { Partner } from '~/types/partners'
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
      return <img {...props} onClick={() => callback(props.src!)} />
    },
  }

  return components
}

function Partner({
  partner,
  overview,
}: {
  partner: Partner
  overview: MDXRemoteSerializeResult<Record<string, unknown>, Record<string, unknown>>
}) {
  const [focusedImage, setFocusedImage] = useState<string | null>(null)

  if (!partner) return <Error404 />

  const videoThumbnail = partner.video
    ? `http://img.youtube.com/vi/${partner.video}/0.jpg`
    : undefined

  return (
    <>
      <NextSeo
        title={`${partner.title} | Works With Supabase`}
        description={partner.description}
        openGraph={{
          title: `${partner.title} | Works With Supabase`,
          description: partner.description,
          url: `https://supabase.com/partners/integrations/${partner.slug}`,
          images: [
            {
              url: partner.images ? partner.images[0] : partner.logo,
            },
          ],
        }}
      />

      {focusedImage ? (
        <ImageModal
          visible
          onCancel={() => setFocusedImage(null)}
          size="xxlarge"
          className="w-full outline-none"
        >
          <Image
            layout="responsive"
            objectFit="contain"
            width={1152}
            height={766}
            src={focusedImage!}
            alt={partner.title}
          />
        </ImageModal>
      ) : null}
      <DefaultLayout>
        <SectionContainer>
          <div className="col-span-12 mx-auto mb-2 max-w-5xl space-y-10 lg:col-span-2">
            {/* Back button */}
            <Link
              href="/partners/integrations"
              className="text-foreground hover:text-foreground-lighter flex cursor-pointer items-center transition-colors"
            >
              <IconChevronLeft style={{ padding: 0 }} />
              Back
            </Link>

            <div className="flex items-center space-x-4">
              <Image
                layout="fixed"
                width={56}
                height={56}
                className="bg-surface-200 flex-shrink-f0 h-14 w-14 rounded-full"
                src={partner.logo}
                alt={partner.title}
              />
              <h1 className="h1" style={{ marginBottom: 0 }}>
                {partner.title}
              </h1>
            </div>

            <div
              className="bg-gradient-to-t from-background-alternative to-background border-b p-6 [&_.swiper-container]:overflow-visible"
              style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}
            >
              <SectionContainer className="!py-0 !px-3 lg:!px-12 xl:!p-0 mx-auto max-w-5xl">
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
                      slidesPerView: 1.25,
                      centeredSlides: false,
                      spaceBetween: 10,
                    },
                    720: {
                      slidesPerView: 2,
                      centeredSlides: false,
                      spaceBetween: 10,
                    },
                    920: {
                      slidesPerView: 3,
                      centeredSlides: false,
                    },
                    1024: {
                      slidesPerView: 4,
                    },
                    1280: {
                      slidesPerView: 5,
                    },
                  }}
                >
                  {partner.images?.map((image: any, i: number) => {
                    return (
                      <SwiperSlide key={i}>
                        <div className="relative block overflow-hidden rounded-md">
                          <Image
                            layout="responsive"
                            objectFit="contain"
                            placeholder="blur"
                            blurDataURL="/images/blur.png"
                            width={1460}
                            height={960}
                            src={image}
                            alt={partner.title}
                            onClick={() => setFocusedImage(image)}
                          />
                        </div>
                      </SwiperSlide>
                    )
                  })}
                </Swiper>
              </SectionContainer>
            </div>

            <div className="grid lg:grid-cols-8 lg:space-x-12">
              <div className="lg:col-span-5 overflow-hidden">
                <h2
                  className="text-foreground"
                  style={{ fontSize: '1.5rem', marginBottom: '1rem' }}
                >
                  Overview
                </h2>

                <div className="prose">
                  <MDXRemote {...overview} components={mdxComponents(setFocusedImage)} />
                </div>
              </div>

              <div className="lg:col-span-3 order-first lg:order-last">
                <div className="sticky top-20">
                  <h2
                    className="text-foreground"
                    style={{ fontSize: '1.5rem', marginBottom: '1rem' }}
                  >
                    Details
                  </h2>

                  {partner.video && (
                    <div className="mb-6">
                      <ExpandableVideo
                        videoId={partner.video}
                        imgUrl={videoThumbnail}
                        imgOverlayText="Watch an introductory video"
                        triggerContainerClassName="w-full"
                      />
                    </div>
                  )}

                  <div className="text-foreground divide-y">
                    {partner.type === 'technology' && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-foreground-lighter">Developer</span>
                        <span className="text-foreground">{partner.developer}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-2">
                      <span className="text-lighter">Category</span>
                      <Link
                        href={`/partners/integrations#${partner.category.toLowerCase()}`}
                        className="text-brand hover:underline transition-colors"
                      >
                        {partner.category}
                      </Link>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-foreground-lighter">Website</span>
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand hover:underline transition-colors"
                      >
                        {new URL(partner.website).host}
                      </a>
                    </div>

                    {partner.type === 'technology' && partner.docs && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-foreground-lighter">Documentation</span>
                        <a
                          href={partner.docs}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand hover:underline transition-colors"
                        >
                          <span className="flex items-center space-x-1">
                            <span>Learn</span>
                            <IconExternalLink size="small" />
                          </span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {partner.call_to_action_link && (
              <div className="bg-background hover:border-default-control border-default rounded-2xl border p-10 drop-shadow-sm max-w-5xl mx-auto mt-12">
                <div className="flex flex-row justify-between">
                  <h1 className="text-2xl font-medium self-center">
                    Get started with {partner.title} and Supabase.
                  </h1>
                  <a href={partner.call_to_action_link} target="_blank" rel="noreferrer">
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

// This function gets called at build time
export const getStaticPaths: GetStaticPaths = async () => {
  const { data: slugs } = await supabase
    .from('partners')
    .select('slug')
    .eq('approved', true)
    .eq('type', 'technology')

  const paths: {
    params: { slug: string }
    locale?: string | undefined
  }[] =
    slugs?.map(({ slug }) => ({
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
export const getStaticProps: GetStaticProps = async ({ params }) => {
  let { data: partner } = await supabase
    .from('partners')
    .select('*')
    .eq('approved', true)
    .eq('slug', params!.slug as string)
    .single()

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
  const overview = await serialize(partner.overview, {
    mdxOptions: {
      useDynamicImport: true,
      remarkPlugins: [remarkGfm, [remarkCodeHike, codeHikeOptions]],
    },
  })

  return {
    props: { partner, overview },
    revalidate: 18000, // In seconds - refresh every 5 hours
  }
}

export default Partner
