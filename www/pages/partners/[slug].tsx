import { createClient } from '@supabase/supabase-js'
import { IconChevronLeft, IconExternalLink, Typography } from '@supabase/ui'
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
          <div className="col-span-12 mb-2 space-y-12 lg:col-span-2">
            {/* Back button */}
            <Typography.Text type="secondary">
              <Link
                href={`/partners/${partner.type === 'technology' ? 'integrations' : 'experts'}`}
              >
                <a className="flex items-center cursor-pointer hover:text-gray-900 dark:hover:text-white">
                  <IconChevronLeft style={{ padding: 0 }} />
                  Back
                </a>
              </Link>
            </Typography.Text>

            <div className="flex items-center space-x-4">
              <img
                className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-f0"
                src={partner.logo}
                alt={partner.title}
              />
              <Typography.Title className="mb-0">{partner.title}</Typography.Title>
            </div>

            <div
              className="p-4 bg-dark-100 dark:bg-dark-700"
              style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}
            >
              <Swiper
                initialSlide={3}
                spaceBetween={0}
                slidesPerView={4}
                speed={300}
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
                      <div className="ml-3 mr-3 cursor-move">
                        <img src={image} alt={partner.title} />
                      </div>
                    </SwiperSlide>
                  )
                })}
              </Swiper>
            </div>

            <div className="grid gap-3 lg:grid-cols-4">
              <div className="lg:col-span-3">
                <Typography.Title
                  level={2}
                  className="mt-8 mb-4 font-bold"
                  style={{ fontSize: '1.5rem' }}
                >
                  Overview
                </Typography.Title>

                <div
                  className="prose dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: partner.overview }}
                />
              </div>

              <div>
                <Typography.Title
                  level={2}
                  className="mt-8 mb-4 font-bold"
                  style={{ fontSize: '1.5rem' }}
                >
                  Details
                </Typography.Title>

                <div className="divide-y">
                  <div className="flex items-center justify-between py-2">
                    <Typography.Text strong>Developer</Typography.Text>
                    <Typography.Text>{partner.developer}</Typography.Text>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <Typography.Text strong>Category</Typography.Text>
                    <Link
                      href={`/partners/${
                        partner.type === 'technology' ? 'integrations' : 'experts'
                      }#${partner.category.toLowerCase()}`}
                    >
                      <a className="text-brand-700 hover:text-brand-800">{partner.category}</a>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <Typography.Text strong>Website</Typography.Text>
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-700 hover:text-brand-800"
                    >
                      {new URL(partner.website).host}
                    </a>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <Typography.Text strong>Documentation</Typography.Text>
                    <a
                      href={partner.docs}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-700 hover:text-brand-800"
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
