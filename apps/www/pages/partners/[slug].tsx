import { IconChevronLeft, IconExternalLink } from 'ui'
import { marked } from 'marked'
import { GetStaticPaths, GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/swiper.min.css'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import supabase from '~/lib/supabase'
import { Partner } from '~/types/partners'
import Error404 from '../404'

function Partner({ partner }: { partner: Partner }) {
  if (!partner) return <Error404 />
  return (
    <>
      <NextSeo
        title={`${partner.title} | Works With Supabase`}
        description={partner.description}
        openGraph={{
          title: `${partner.title} | Works With Supabase`,
          description: partner.description,
          url: `https://supabase.com/partners/${partner.slug}`,
          images: [
            {
              url: partner.images[0] ?? partner.logo,
            },
          ],
        }}
      />

      <DefaultLayout>
        <SectionContainer>
          <div className="col-span-12 mx-auto mb-2 max-w-5xl space-y-12 lg:col-span-2">
            {/* Back button */}
            <Link href={`/partners/${partner.type === 'technology' ? 'integrations' : 'experts'}`}>
              <a className="text-scale-1200 hover:text-scale-1000 flex cursor-pointer items-center transition-colors">
                <IconChevronLeft style={{ padding: 0 }} />
                Back
              </a>
            </Link>

            <div className="flex items-center space-x-4">
              <Image
                layout="fixed"
                width={56}
                height={56}
                className="bg-scale-400 flex-shrink-f0 h-14 w-14 rounded-full"
                src={partner.logo}
                alt={partner.title}
              />
              <h1 className="h1" style={{ marginBottom: 0 }}>
                {partner.title}
              </h1>
            </div>

            <div
              className="bg-scale-300 py-6"
              style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}
            >
              <Swiper
                initialSlide={0}
                spaceBetween={0}
                slidesPerView={4}
                speed={300}
                // slidesOffsetBefore={300}
                centerInsufficientSlides={true}
                breakpoints={{
                  320: {
                    slidesPerView: 1,
                  },
                  720: {
                    slidesPerView: 2,
                  },
                  920: {
                    slidesPerView: 3,
                  },
                  1024: {
                    slidesPerView: 4,
                  },
                  1208: {
                    slidesPerView: 5,
                  },
                }}
              >
                {partner.images.map((image: any, i: number) => {
                  return (
                    <SwiperSlide key={i}>
                      <div className="relative ml-3 mr-3 block cursor-move overflow-hidden rounded-md">
                        <Image
                          layout="responsive"
                          objectFit="contain"
                          width={1460}
                          height={960}
                          src={image}
                          alt={partner.title}
                        />
                      </div>
                    </SwiperSlide>
                  )
                })}
              </Swiper>
            </div>

            <div className="grid gap-3 space-y-16 lg:grid-cols-4 lg:space-y-0 lg:space-x-3">
              <div className="lg:col-span-3">
                <h2
                  className="text-scale-1200"
                  style={{ fontSize: '1.5rem', marginBottom: '1rem' }}
                >
                  Overview
                </h2>

                {partner.video && (
                  <div
                    className="bg-scale-1000 relative w-full rounded-b-md shadow-lg"
                    style={{ padding: '56.25% 0 0 0', marginBottom: '1rem' }}
                  >
                    <iframe
                      title="Demo video showcasing Supabase"
                      className="absolute h-full w-full rounded-b-md"
                      src={`https://www.youtube-nocookie.com/embed/${partner.video}?autoplay=0&loop=0&controls=1&modestbranding=1&rel=0&disablekb=1`}
                      style={{ top: 0, left: 0 }}
                      frameBorder="0"
                      allow="autoplay; modestbranding; encrypted-media"
                    />
                  </div>
                )}

                <div className="prose" dangerouslySetInnerHTML={{ __html: partner.overview }} />
              </div>

              <div>
                <h2
                  className="text-scale-1200"
                  style={{ fontSize: '1.5rem', marginBottom: '1rem' }}
                >
                  Details
                </h2>

                <div className="text-scale-1200 divide-y">
                  {partner.type === 'technology' && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-scale-900">Developer</span>
                      <span className="text-scale-1200">{partner.developer}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-2">
                    <span className="text-scale-900">Category</span>
                    <Link
                      href={`/partners/${
                        partner.type === 'technology' ? 'integrations' : 'experts'
                      }#${partner.category.toLowerCase()}`}
                    >
                      <a className="text-brand-900 hover:text-brand-800 transition-colors">
                        {partner.category}
                      </a>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-scale-900">Website</span>
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-900 hover:text-brand-800 transition-colors"
                    >
                      {new URL(partner.website).host}
                    </a>
                  </div>

                  {partner.type === 'technology' && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-scale-900">Documentation</span>
                      <a
                        href={partner.docs}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-900 hover:text-brand-800 transition-colors"
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
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

// This function gets called at build time
export const getStaticPaths: GetStaticPaths = async () => {
  const { data: slugs } = await supabase.from('partners').select('slug')

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

  // Parse markdown
  partner.overview = marked.parse(partner.overview)

  return {
    props: { partner },
    revalidate: 18000, // In seconds - refresh every 5 hours
  }
}

export default Partner
