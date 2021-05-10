import Container from 'components/Container'
import { createClient } from '@supabase/supabase-js'
import Layout from '~/components/Layouts/Default'
import BrandHero from 'components/Brand/BrandHero'
import CTABanner from 'components/CTABanner/index'
import { Button, Space, IconArrowUpRight, Typography, Badge, IconKey, IconDownload, IconX, IconBriefcase, IconEye } from '@supabase/ui'
// Import Swiper styles if swiper used on page
import 'swiper/swiper.min.css'
import ApiExamplesData from 'data/products/brand/badge-components'
import ExtensionsExamplesData from 'data/products/database/extensions-examples'
import SqlViewCarouselData from 'data/products/database/sql-view-carousel.json'
import TableViewCarouselData from 'data/products/database/table-view-carousel.json'
import Solutions from 'data/Solutions.json'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
// Import Swiper styles
import 'swiper/swiper.min.css'
import ImageCarousel from '~/components/Carousels/ImageCarousel'
import SplitCodeBlockCarousel from '~/components/Carousels/SplitCodeBlockCarousel'
import FeatureColumn from '~/components/FeatureColumn'
import FloatingIcons from '~/components/FloatingIcons'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import ProductIcon from '~/components/ProductIcon'
import Badges from '~/components/Brand/Badges'
import AuthSqlRulesExamples from 'data/products/auth/auth-sql-rules-examples'
import AuthComponentExample from '~/components/Brand/Logos'

type Props = {}

const Index = ({}: Props) => {
  // base path for images
  const { basePath } = useRouter()

  // supabase auth widget project details
  const supabase = createClient(
    'https://rsnibhkhsbfnncjmwnkj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNTIxNDE1MywiZXhwIjoxOTMwNzkwMTUzfQ.OQEbAaTfgDdLCCht251P2JRD3QDnui6nsU8N-tZA_Mc'
  )
  return (
    <>
      <Layout>
        <Container>
          <BrandHero />
          <SectionContainer className="-mb-48">
          <Badges
            content={ApiExamplesData}
            title="Supabase Badges"
            text={[
              <p>
                If you're built with Supabase, you can add a Powered By Supabase badge if you'd like.
                Availiable as an SVG, React Component, and Plain HTML.
              </p>,
            ]}
            footer={[
              <div className="grid grid-cols-12 mb-48">
                <div className="mt-0 col-span-12 lg:col-span-6 xl:col-span-12 xl:mb-8">
                  <Space>
                    <Typography.Text type="secondary">
                      <p className="m-0">Badges Availiable As:</p>{' '}
                    </Typography.Text>
                    <Badge dot={false} color="blue">
                      React
                    </Badge>
                    <Badge dot={false} color="blue">
                      HTML
                    </Badge>
                    <Badge dot={false} color="blue">
                      SVG
                    </Badge>
                  </Space>
                </div>
              </div>,
            ]}
            documentation_link={'https://supabase.io/docs/guides/database'}
          />
        </SectionContainer>
        <SectionContainer>
          <div className="grid grid-cols-12 lg:gap-16">
            <div className="order-last col-span-12 lg:order-first lg:col-span-6 mt-8 lg:mt-0">
              <AuthComponentExample />
            </div>
            <div className="col-span-12 lg:col-span-6 lg:col-start-7 xl:col-span-4 xl:col-start-8">
              <Typography.Title level={2} className="mb-4">
                Supabase Logos
              </Typography.Title>
              <Typography.Text>
                <p className="text-base lg:text-lg">
                  Download Supabase's official logos, including as SVG's, in both light and dark theme.
                </p>
              </Typography.Text>
              <Link
                href="https://github.com/supabase/ui#using-supabase-ui-auth"
                as="https://github.com/supabase/ui#using-supabase-ui-auth"
              >
                <a>
                  <Button size="small" type="default" className="mt-4" iconRight={<IconDownload />}>
                    Download Full Logo Kit
                  </Button>
                </a>
              </Link>
            </div>
          </div>
        </SectionContainer>
        <CTABanner />
        </Container>
      </Layout>
    </>
  )
}

export default Index
