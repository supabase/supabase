import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Partner } from '~/types/partners'
import { NextSeo } from 'next-seo'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { Typography, IconChevronLeft, Divider, IconExternalLink } from '@supabase/ui'
import { Swiper, SwiperSlide } from 'swiper/react'
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
          <div className="col-span-12 lg:col-span-2 mb-2">
            {/* Back button */}
            <Typography.Text type="secondary">
              <a
                href={'/partners'}
                className="hover:text-gray-900 dark:hover:text-white cursor-pointer flex items-center"
              >
                <IconChevronLeft style={{ padding: 0 }} />
                Back
              </a>
            </Typography.Text>

            <div className="flex">
              <img
                className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"
                src={partner.logo}
                alt={partner.title}
              />
              <Typography.Title>{partner.title}</Typography.Title>
            </div>
            <div className="mt-6">
              <div className={'lg:-mr-32 lg:-ml-32'}>
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
                        <div className="mr-3 ml-3 cursor-move">
                          <img src={image} alt={partner.title} />
                        </div>
                      </SwiperSlide>
                    )
                  })}
                </Swiper>
              </div>
            </div>
            <div className="grid lg:grid-cols-5 gap-3">
              <div className="lg:col-span-3">
                <Typography.Title level={2}>Overview</Typography.Title>
                <Typography.Text>{partner.overview}</Typography.Text>
              </div>
              <div>
                <Typography.Title level={2}>Details</Typography.Title>
                <div className="flex justify-between">
                  <Typography.Text strong>Developer</Typography.Text>
                  <Typography.Text>{partner.developer}</Typography.Text>
                </div>
                <Divider />
                <div className="flex justify-between">
                  <Typography.Text strong>Category</Typography.Text>
                  <Link
                    href={`/partners/${
                      partner.type === 'technology' ? 'integrations' : partner.type
                    }#${partner.category.toLowerCase()}`}
                  >
                    <a className="text-brand-700 hover:text-brand-800">{partner.category}</a>
                  </Link>
                </div>
                <Divider />
                <div className="flex justify-between">
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
                <Divider />
                <div className="flex justify-between">
                  <Typography.Text strong>Documentation</Typography.Text>
                  <a
                    href={partner.docs}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-700 hover:text-brand-800"
                  >
                    <span className="flex">
                      Read <IconExternalLink />
                    </span>
                  </a>
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
  }[] = []
  slugs?.map((slug) => ({
    params: {
      slug,
    },
  }))
  return {
    paths,
    fallback: 'blocking',
  }
}

// This also gets called at build time
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { data: partner } = await supabase
    .from<Partner>('partners')
    .select('*')
    .eq('slug', params!.slug as string)
    .single()

  return {
    props: { partner },
    revalidate: 18000, // In seconds - refresh every 5 hours
  }
}

export default Partner
