import { Button, IconGrid, IconLayers, IconMenu } from 'ui'
import ApiExamples from 'data/products/realtime/api-examples'
import AppExamples from 'data/products/realtime/app-examples'
import Solutions from 'data/Solutions'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import APISection from '~/components/Sections/APISection'
import ProductHeader from '~/components/Sections/ProductHeader'
import RealtimeStyles from './Realtime.module.css'
import ProductsNav from '~/components/Products/ProductsNav'

import 'swiper/css'
import { ThemeImage } from 'ui-patterns/ThemeImage'
import { PRODUCT_NAMES } from 'shared-data/products'

const Cursor = ({ className = '', color = 'none' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill={color}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-10 w-10 stroke-foreground ${className}`}
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

function RealtimePage() {
  // base path for images
  const { basePath } = useRouter()
  const meta_title = 'Realtime | Sync your data in real time'
  const meta_description =
    'Listens to changes in a PostgreSQL Database and broadcasts them over WebSockets'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/realtime`,
          images: [
            {
              url: `https://supabase.com${basePath}/images/realtime/og.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <ProductsNav activePage={PRODUCT_NAMES.REALTIME} />
        <ProductHeader
          icon={Solutions['realtime']?.icon}
          title={Solutions['realtime']?.name}
          h1={[<span key={'authentication-h1'}>Build modern web and mobile applications</span>]}
          subheader={['Sync client state globally over WebSockets in Realtime']}
          image={[
            <div className="bg-surface-100 border-default relative flex h-[372px] w-[560px] items-center justify-center overflow-hidden rounded border drop-shadow-md">
              <div
                className={[
                  'border-brand-300 relative h-12 w-48 bg-brand',
                  `flex items-center justify-center ${RealtimeStyles['shape']}`,
                ].join(' ')}
              >
                <p
                  className={`text-foreground text-[18px] font-medium ${RealtimeStyles['button-text']}`}
                >
                  Start a project
                </p>
              </div>
              <Cursor
                color="var(--colors-yellow9)"
                className={`${RealtimeStyles['cursor-one']} absolute top-[220px] right-[130px]`}
              />
              <Cursor
                color="var(--colors-indigo9)"
                className={`${RealtimeStyles['cursor-two']} absolute top-[180px] right-[280px]`}
              />
              <div
                className={[
                  'border-foreground absolute bottom-[40px] left-[175px] flex h-10 w-20',
                  'items-center justify-center space-x-2 rounded-full border-[3px] bg-indigo-900',
                  `${RealtimeStyles['cursor-two-comment']}`,
                ].join(' ')}
              >
                <p className="text-lg">🤔</p>
              </div>
              <Cursor
                color="var(--colors-tomato9)"
                className={`${RealtimeStyles['cursor-three']} absolute top-[170px] right-[180px]`}
              />
              <div
                className={[
                  'border-foreground absolute top-[72px] left-[320px] flex h-10 w-20',
                  'items-center justify-center space-x-2 rounded-full border-[3px] bg-tomato-900',
                  `${RealtimeStyles['cursor-three-comment']}`,
                ].join(' ')}
              >
                <p className="text-lg">😄</p>
              </div>
              <div className="bg-background border-default absolute top-0 flex h-9 w-full items-center justify-between border-b">
                <div className="flex items-center">
                  <IconMenu className="text-foreground mx-3" strokeWidth={1} size={16} />
                  <IconGrid className="text-foreground mx-3" strokeWidth={1} size={15} />
                  <IconLayers className="text-foreground mx-3" strokeWidth={1} size={15} />
                </div>
                <div className="mx-3 flex items-center">
                  <div className="border-foreground bg-tomato-900 relative -right-4 h-5 w-5 rounded-full border" />
                  <div className="border-foreground bg-yellow-900 relative -right-2 z-[2] h-5 w-5 rounded-full border" />
                  <div className="border-foreground bg-indigo-900 z-[3] h-5 w-5 rounded-full border" />
                </div>
              </div>
            </div>,
          ]}
          documentation_url={'/docs/guides/realtime/broadcast'}
        />

        <SectionContainer>
          <div className="grid grid-cols-12">
            <div className="prose col-span-12 mb-10 lg:col-span-3 lg:mb-0">
              <div className="p mb-4">
                <img
                  src="/images/realtime/icons/database-changes.svg"
                  alt="realtime broadcast"
                  className="-mb-4 w-9"
                />
              </div>
              <h3>Database changes</h3>
              <p>
                Listen to changes in the Database inserts, updates, and deletes and other changes.
              </p>
              <div className="not-prose mt-3">
                <Button asChild type="default">
                  <Link href="/docs/guides/realtime/postgres-changes">View docs</Link>
                </Button>
              </div>
            </div>
            <div className="prose col-span-12 mb-10 lg:col-span-3 lg:col-start-5 lg:mb-0">
              <div className="p mb-4">
                <img
                  src="/images/realtime/icons/presence.svg"
                  alt="realtime broadcast"
                  className="-mb-4 w-9"
                />
              </div>
              <h3>Presence</h3>
              <p>Store and synchronize online user state consistently across clients.</p>
              <div className="not-prose mt-3">
                <Button asChild type="default">
                  <Link href="/docs/guides/realtime/presence">View docs</Link>
                </Button>
              </div>
            </div>
            <div className="prose col-span-12 lg:col-span-3 lg:col-start-9">
              <div className="p mb-4">
                <img
                  src="/images/realtime/icons/broadcast.svg"
                  alt="realtime broadcast"
                  className="-mb-4 w-9"
                />
              </div>
              <h3>Broadcast</h3>
              <p>Send any data to any client subscribed to the same Channel.</p>
              <div className="not-prose mt-3">
                <Button asChild type="default">
                  <Link href="/docs/guides/realtime/broadcast">View docs</Link>
                </Button>
              </div>
            </div>
          </div>
        </SectionContainer>

        <SectionContainer className="flex flex-col gap-8">
          <div className="flex flex-col items-center justify-center">
            <h2 className="h3">What you can build with Realtime</h2>
            <p className="p mx-auto text-center lg:w-1/2">
              Build any kind of Realtime application with ease, including any of these scenarios.
            </p>
          </div>
          <div className="grid gap-10 grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
            {AppExamples.map((example) => {
              return (
                <>
                  <div className="flex flex-col gap-3">
                    <ThemeImage
                      alt={example.title}
                      src={{
                        light: `/images/realtime/example-apps/light/${example.img}?type=1`,
                        dark: `/images/realtime/example-apps/dark/${example.img}`,
                      }}
                      className="bg-surface-100 rounded-lg"
                      layout="fill"
                      objectFit="contain"
                    />
                    <div className="prose">
                      <h4>{example.title}</h4>
                      <p className="text-sm">{example.description}</p>
                    </div>
                  </div>
                </>
              )
            })}
          </div>
        </SectionContainer>

        <SectionContainer>
          <APISection
            title="Simple and convenient APIs"
            // @ts-ignore
            content={ApiExamples}
            size="large"
            text={[
              <p key={0}>
                <p className="text-base lg:text-lg">
                  APIs that you can understand. With powerful libraries that work on client and
                  server-side applications.
                </p>
              </p>,
            ]}
            // [TODO] Point to the correct docs URL
            documentation_link={'/docs/guides/realtime/broadcast'}
          />
        </SectionContainer>

        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default RealtimePage
