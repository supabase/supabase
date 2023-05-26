import { Button, IconGrid, IconLayers, IconMenu } from 'ui'
import Solutions from 'data/Solutions.json'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import CommunitySlider from '~/components/Sections/CommunitySlider'
import APISection from '~/components/Sections/APISection'
import ProductHeaderCentered from '~/components/Sections/ProductHeaderCentered'
import VectorStyles from './vector.module.css'
import FeaturesSection from '~/components/Sections/FeaturesSection'
import HighlightCards from '~/components/Sections/HighlightCards'
import UseCasesSection from '~/components/Sections/UseCasesSection'
import CenteredTitleImage from '~/components/Sections/CenteredTitleImage'
import TimedTabs from '~/components/Sections/TimedTabs'
import { pageData } from '~/data/products/vector/page'

import 'swiper/swiper.min.css'

const Cursor = ({ className = '', color = 'none' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill={color}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-10 w-10 stroke-black dark:stroke-white ${className}`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"
      />
    </svg>
  )
}

function VectorPage() {
  // base path for images
  const { basePath } = useRouter()
  const meta_title = 'Vector | The open source vector database for AI applications'
  const meta_description =
    'Integrate Supabase Vector database with your favorite ML-models to store, index and access vector embeddings for any AI use case.'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/vector`,
          images: [
            {
              url: `https://supabase.com${basePath}/images/vector/og.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <ProductHeaderCentered
          icon={Solutions['vector']?.icon}
          title={Solutions['vector']?.name}
          h1={[
            <span key={'vector-h1'}>
              The open source Vector Database <br className="hidden md:block" />
              for AI applications
            </span>,
          ]}
          subheader={[
            'Integrate your favorite ML-models to easily store, index and search vector embeddings for any AI use case.',
          ]}
          image={[
            <div className="bg-scale-300 border-scale-500 relative flex h-[372px] w-[560px] items-center justify-center overflow-hidden rounded border drop-shadow-md">
              <div
                className={[
                  'border-brand-800 relative h-12 w-48 bg-[#34B27B]',
                  `flex items-center justify-center ${VectorStyles['shape']}`,
                ].join(' ')}
              >
                <p
                  className={`text-scale-1200 text-[18px] font-medium ${VectorStyles['button-text']}`}
                >
                  Start for free
                </p>
              </div>
              <Cursor
                color="var(--colors-yellow9)"
                className={`${VectorStyles['cursor-one']} absolute top-[220px] right-[130px]`}
              />
              <Cursor
                color="var(--colors-indigo9)"
                className={`${VectorStyles['cursor-two']} absolute top-[180px] right-[280px]`}
              />
              <div
                className={[
                  'border-scale-1200 absolute bottom-[40px] left-[175px] flex h-10 w-20',
                  'items-center justify-center space-x-2 rounded-full border-[3px] bg-indigo-900',
                  `${VectorStyles['cursor-two-comment']}`,
                ].join(' ')}
              >
                <p className="text-lg">🤔</p>
              </div>
              <Cursor
                color="var(--colors-tomato9)"
                className={`${VectorStyles['cursor-three']} absolute top-[170px] right-[180px]`}
              />
              <div
                className={[
                  'border-scale-1200 absolute top-[72px] left-[320px] flex h-10 w-20',
                  'items-center justify-center space-x-2 rounded-full border-[3px] bg-tomato-900',
                  `${VectorStyles['cursor-three-comment']}`,
                ].join(' ')}
              >
                <p className="text-lg">😄</p>
              </div>
              {/* <div className="bg-scale-100 border-scale-500 absolute left-0 h-full w-24 border-r py-9 shadow">
                <div className="border-scale-500 h-7 border-b" />
              </div> */}
              {/* <div className="bg-scale-100 border-scale-500 absolute right-0 h-full w-20 border-l py-9 shadow">
                <div className="border-scale-500 h-7 border-b" />
              </div> */}
              <div className="bg-scale-200 border-scale-500 absolute top-0 flex h-9 w-full items-center justify-between border-b">
                <div className="flex items-center">
                  <IconMenu className="text-scale-1200 mx-3" strokeWidth={1} size={16} />
                  <IconGrid className="text-scale-1200 mx-3" strokeWidth={1} size={15} />
                  <IconLayers className="text-scale-1200 mx-3" strokeWidth={1} size={15} />
                </div>
                <div className="mx-3 flex items-center">
                  <div className="border-scale-300 dark:border-scale-1200 bg-tomato-900 dark:bg-tomato-900 relative -right-4 h-5 w-5 rounded-full border" />
                  <div className="border-scale-300 dark:border-scale-1200 bg-yellow-900 dark:bg-yellow-900 relative -right-2 z-[2] h-5 w-5 rounded-full border" />
                  <div className="border-scale-300 dark:border-scale-1200 bg-indigo-900 dark:bg-indigo-900 z-[3] h-5 w-5 rounded-full border" />
                </div>
              </div>
            </div>,
          ]}
          documentation_url={'/docs/guides/vector/broadcast'}
        />

        <HighlightCards highlights={pageData.highlights} />

        <CenteredTitleImage {...pageData.integrations} />

        <UseCasesSection {...pageData.useCasesSection} />

        <TimedTabs {...pageData.APIsection} />

        <FeaturesSection {...pageData.featuresSection} />

        <CommunitySlider />

        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default VectorPage
