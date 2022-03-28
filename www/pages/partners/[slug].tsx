import { createClient } from '@supabase/supabase-js'
import { IconChevronLeft, IconExternalLink } from '@supabase/ui'
import { marked } from 'marked'
import { GetStaticPaths, GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/swiper.min.css'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { Partner } from '~/types/partners'
import Error404 from '../404'
import Image from 'next/image'

const supabase = createClient(
  'https://obuldanrptloktxcffvn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNzY1NjAxNSwiZXhwIjoxOTUzMjMyMDE1fQ.0sfp_Njf7l4g-nOCF5a1TQE11rPqtz8Y10uctIetkBA'
)

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
          <div className="max-w-5xl col-span-12 mx-auto mb-2 space-y-12 lg:col-span-2">
            {/* Back button */}
            <Link href={`/partners/${partner.type === 'technology' ? 'integrations' : 'experts'}`}>
              <a className="flex items-center transition-colors cursor-pointer text-scale-1200 hover:text-scale-1000">
                <IconChevronLeft style={{ padding: 0 }} />
                Back
              </a>
            </Link>

            <div className="flex items-center space-x-4">
              <Image
                layout="fixed"
                width={56}
                height={56}
                className="rounded-full bg-scale-400 w-14 h-14 flex-shrink-f0"
                src={partner.logo}
                alt={partner.title}
              />
              <h1 className="text-6xl font-semibold text-scale-1200" style={{ marginBottom: 0 }}>
                {partner.title}
              </h1>
            </div>

            <div
              className="py-6 bg-scale-400"
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
                      <div className="relative block ml-3 mr-3 cursor-move">
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

            <div className="grid gap-3 lg:grid-cols-4">
              <div className="lg:col-span-3">
                <h2
                  className="mt-8 font-bold text-scale-1200"
                  style={{ fontSize: '1.5rem', marginBottom: '1rem' }}
                >
                  Overview
                </h2>

                <div className="prose" dangerouslySetInnerHTML={{ __html: partner.overview }} />
              </div>

              <div>
                <h2
                  className="mt-8 font-bold text-scale-1200"
                  style={{ fontSize: '1.5rem', marginBottom: '1rem' }}
                >
                  Details
                </h2>

                <div className="divide-y text-scale-1200">
                  <div className="flex items-center justify-between py-2">
                    <strong>Developer</strong>
                    <span>{partner.developer}</span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <strong>Category</strong>
                    <Link
                      href={`/partners/${
                        partner.type === 'technology' ? 'integrations' : 'experts'
                      }#${partner.category.toLowerCase()}`}
                    >
                      <a className="transition-colors text-brand-900 hover:text-brand-800">
                        {partner.category}
                      </a>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <strong>Website</strong>
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors text-brand-900 hover:text-brand-800"
                    >
                      {new URL(partner.website).host}
                    </a>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <strong>Documentation</strong>
                    <a
                      href={partner.docs}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors text-brand-900 hover:text-brand-800"
                    >
                      <span className="flex items-center space-x-1">
                        <span>Read</span>
                        <IconExternalLink size="small" />
                      </span>
                    </a>
                  </div>
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
  const { data: slugs } = await supabase.from<Partner>('partners').select('slug')

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
    .from<Partner>('partners')
    .select('*')
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
