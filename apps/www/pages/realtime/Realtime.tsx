import { Button, IconGrid, IconLayers, IconMenu } from '@supabase/ui'
import ApiExamples from 'data/products/realtime/api-examples'
import AppExamples from 'data/products/realtime/app-examples'
import Solutions from 'data/Solutions.json'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import APISection from '~/components/Sections/APISection'
import ProductHeader from '~/components/Sections/ProductHeader'
import RealtimeStyles from './Realtime.module.css'

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
        <ProductHeader
          icon={Solutions['realtime']?.icon}
          title={Solutions['realtime']?.name}
          h1={[<span key={'authentication-h1'}>Build modern web and mobile applications</span>]}
          subheader={['Sync client state globally over WebSockets in Realtime']}
          image={[
            <div className="bg-scale-300 border-scale-500 relative flex h-[372px] w-[560px] items-center justify-center overflow-hidden rounded border drop-shadow-md">
              <div
                className={[
                  'border-brand-800 relative h-12 w-48 bg-[#34B27B]',
                  `flex items-center justify-center ${RealtimeStyles['shape']}`,
                ].join(' ')}
              >
                <p
                  className={`text-scale-1200 text-[18px] font-medium ${RealtimeStyles['button-text']}`}
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
                  'border-scale-1200 absolute bottom-[40px] left-[175px] flex h-10 w-20',
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
                  'border-scale-1200 absolute top-[72px] left-[320px] flex h-10 w-20',
                  'items-center justify-center space-x-2 rounded-full border-[3px] bg-tomato-900',
                  `${RealtimeStyles['cursor-three-comment']}`,
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
                <Link passHref href="/docs/guides/realtime/postgres-changes">
                  <Button as="a" type="default">
                    View docs
                  </Button>
                </Link>
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
                <Link passHref href="/docs/guides/realtime/presence">
                  <Button as="a" type="default">
                    View docs
                  </Button>
                </Link>
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
                <Link passHref href="/docs/guides/realtime/broadcast">
                  <Button as="a" type="default">
                    View docs
                  </Button>
                </Link>
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
                    <img
                      className="bg-scale-300 hidden rounded-lg dark:block"
                      src={`/images/realtime/example-apps/dark/${example.img}?type=1`}
                      alt={example.title}
                    />
                    <img
                      className="bg-scale-300 block rounded-lg dark:hidden"
                      src={`/images/realtime/example-apps/light/${example.img}`}
                      alt={example.title}
                    />
                    <div className="prose">
                      <h4 className="">{example.title}</h4>
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
