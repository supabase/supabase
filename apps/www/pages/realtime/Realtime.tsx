import { Button, IconArrowUpRight, IconLink } from '@supabase/ui'

// [TODO] These need to be relooked - I'm using multiplayer.dev as a "docs"
import ApiExamples from 'data/products/realtime/api-examples'
import AppExamples from 'data/products/realtime/app-examples'
import RealtimeStyles from './Realtime.module.css'

import AuthSqlRulesExamples from 'data/products/auth/auth-sql-rules-examples'
import Solutions from 'data/Solutions.json'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SplitCodeBlockCarousel from '~/components/Carousels/SplitCodeBlockCarousel'
import CTABanner from '~/components/CTABanner'
import FloatingIcons from '~/components/FloatingIcons'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import APISection from '~/components/Sections/APISection'
import GithubExamples from '~/components/Sections/GithubExamples'
import ProductHeader from '~/components/Sections/ProductHeader'
import { CursorClickIcon } from '@heroicons/react/outline'
import CodeBlock from '~/components/CodeBlock/CodeBlock'

const Cursor = ({ className = '', color = 'none' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill={color}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-12 w-12 stroke-black dark:stroke-white ${className}`}
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

const exampleApps = [
  {
    img: 'toast-messages.svg',
    title: 'Toast messages',
    description: 'sadcsdas sad asds dsdas asdas as',
  },
  {
    img: 'live-avatars.svg',
    title: 'Live avatars',
    description: 'sadcsdas sad asds dsdas asdas as',
  },
  {
    img: 'live-cursors.svg',
    title: 'Live cursors',
    description: 'sadcsdas sad asds dsdas asdas as',
  },
  {
    img: 'leaderboard.svg',
    title: 'Leaderboards',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.',
  },
  {
    img: 'stock-market.svg',
    title: 'Live charts',
    description:
      'Keep charts updated in realtime. Supabase can detect changes in your database and then update the client immediately.',
  },
  { img: 'in-app-chat.svg', title: 'In app chat', description: 'sadcsdas sad asds dsdas asdas as' },
  {
    img: 'text-editor.svg',
    title: 'Shared code editor editor',
    description: 'sadcsdas sad asds dsdas asdas as',
  },

  { img: 'whiteboard.svg', title: 'Shared whiteboard', description: 'bbb' },
  { img: 'location.svg', title: 'Location', description: 'bbb' },
  { img: 'multiplayer-game.svg', title: 'Multiplayer games', description: 'bbb' },
]

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
              // [TODO] Update OG image
              // [TODO] Update to use an appropriate icon for realtime in Solutions.json
              url: `https://supabase.com${basePath}/images/product/auth/auth-og.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <ProductHeader
          icon={Solutions['realtime']?.icon}
          title={Solutions['realtime']?.name}
          h1={[<span key={'authentication-h1'}>Build reactive web and mobile applications</span>]}
          subheader={[
            'Sync data across clients by listening to changes in your Database and broadcasting them over web sockets',
          ]}
          image={[
            // [TODO] Just playing around with some ideas
            <div className="bg-scale-300 relative flex h-[372px] w-[560px] items-center justify-center rounded">
              <p className="p absolute top-4 left-4">Just playing around with some ideas</p>
              <div
                className={[
                  'bg-brand-900 border-brand-800 relative h-12 w-48 rounded-full border-[3px]',
                  `${RealtimeStyles['element']}`,
                ].join(' ')}
              />
              <Cursor
                color="#236574"
                className={`${RealtimeStyles['cursor-1']} absolute top-[210px] right-[130px]`}
              />
              <Cursor
                color="#170B6B"
                className={`${RealtimeStyles['cursor-2']} absolute top-[300px] right-[400px]`}
              />
              <div
                className={[
                  'border-scale-1200 absolute bottom-[45px] left-[215px] flex h-10 w-32',
                  'items-center justify-center space-x-2 rounded-full border-[3px] bg-[#170B6B]',
                  `${RealtimeStyles['comment-bubble']}`,
                ].join(' ')}
              >
                <div className="bg-scale-1200 h-2 w-2 rounded-full" />
                <div className="bg-scale-1200 h-2 w-2 rounded-full" />
                <div className="bg-scale-1200 h-2 w-2 rounded-full" />
              </div>
            </div>,
            // <div className="header--light block w-full" key="light">
            //   <Image
            //     src={`${basePath}/images/product/auth/header--light.png`}
            //     alt="auth header"
            //     layout="responsive"
            //     width="1372"
            //     height="1074"
            //   />
            // </div>,
            // <div className="header--dark mr-0 w-full dark:block" key="dark">
            //   <Image
            //     src={`${basePath}/images/product/auth/header--dark.png`}
            //     alt="auth header"
            //     layout="responsive"
            //     width="1372"
            //     height="1074"
            //   />
            // </div>,
          ]}
          // [TODO] Point to the correct docs URL
          documentation_url={'/docs/guides/auth'}
        />

        {/* <CodeBlock lang="js">
          {`
          function hello() {

          return (
<div className="flex flex-col items-center justify-center">
  <div className="bg-scale-300 relative flex h-[372px] w-[560px] items-center justify-center rounded">               
    <div className="bg-brand-900 border-brand-800 relative h-12 w-48 rounded-full border-[3px]"> 
    </div>
  </div>
</div>
  )
}
          `}
        </CodeBlock> */}

        <SectionContainer>
          <div className="grid grid-cols-12">
            <div className="col-span-12 mb-10 lg:col-span-3 lg:mb-0">
              <div className="p mb-4">
                <img
                  src="/images/realtime/icons/database-changes.svg"
                  alt="realtime broadcast"
                  className="w-9"
                />
              </div>
              <h4 className="h4">Database changes</h4>
              <p className="p text-base">
                Enable social logins with the click of a button. Google, Facebook, GitHub, Azure,
                Gitlab, Twitter, Discord, and many more.
              </p>
            </div>
            <div className="col-span-12 mb-10 lg:col-span-3 lg:col-start-5 lg:mb-0">
              <div className="p mb-4">
                <img
                  src="/images/realtime/icons/presence.svg"
                  alt="realtime broadcast"
                  className="w-9"
                />
              </div>
              <h4 className="h4">Presence</h4>
              <p className="p text-base">
                Incredibly simple Auth, without a single external authentication service. Built-in
                Authentication, Authorization, and User Management.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-3 lg:col-start-9">
              <div className="p mb-4">
                <img
                  src="/images/realtime/icons/broadcast.svg"
                  alt="realtime broadcast"
                  className="w-9"
                />
              </div>
              <h4 className="h4">Broadcast</h4>
              <p className="p text-base">
                User data stored in your Supabase database so you never have to worry about 3rd
                party privacy issues. Host your data in 8 different locations.
              </p>
            </div>
          </div>
        </SectionContainer>

        <SectionContainer className="flex flex-col gap-8">
          <div className="flex flex-col items-center justify-center">
            <h2 className="h3">What you can build with Realtime</h2>
            <p className="p mx-auto text-center lg:w-1/2">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {exampleApps.map((example) => {
              return (
                <div className="flex flex-col gap-4">
                  <img
                    className="bg-scale-300 hidden rounded-lg dark:block"
                    src={`/images/realtime/example-apps/dark/${example.img}`}
                    alt={example.title}
                  />
                  <img
                    className="bg-scale-300 block rounded-lg dark:hidden"
                    src={`/images/realtime/example-apps/light/${example.img}`}
                    alt={example.title}
                  />
                  <div>
                    <h3 className="text-scale-1200 text-xl">{example.title}</h3>
                    <p className="text-scale-1100 text-sm">{example.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionContainer>

        <SectionContainer className="-mb-48">
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
            documentation_link={'/docs/guides/auth'}
          />
        </SectionContainer>
        <div className="relative">
          <div className="section--masked">
            <div className="section--bg-masked">
              <div className="section--bg border-t border-b border-gray-100 dark:border-gray-600"></div>
            </div>
            <div className="section-container pt-12 pb-0">
              <FloatingIcons />
              <div className="overflow-x-hidden">
                <SectionContainer className="mb-0 pb-8">
                  <GithubExamples />
                </SectionContainer>
              </div>
            </div>
          </div>
        </div>
        <SectionContainer>
          <div className="grid grid-cols-12">
            <div className="col-span-12 text-center">
              <h2 className="h3">What you can build with Realtime</h2>
              <p className="p mx-auto lg:w-1/2">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua.
              </p>
              <div className="col-span-12 grid grid-cols-12 gap-8 py-16">
                {AppExamples.map((example) => {
                  return (
                    <div className="col-span-3">
                      <div className="bg-scale-500 mb-4 h-40 w-full rounded" />
                      <p className="p !mb-2 text-left">{example.title}</p>
                      <p className="p text-left text-sm">{example.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </SectionContainer>
        {/* Somehow removing this section messes up all the alignment? */}
        <SectionContainer>
          <div className="grid grid-cols-12 lg:gap-16">
            <div className="col-span-12 mb-8 lg:col-span-5">
              <h2 className="h3">User permissions without the middleware</h2>

              <p className="p text-base lg:text-lg">
                Supabase Auth works without any additional servers. Build Authorization rules with
                Postgres' Row Level Security, controlling who can create, edit and delete specific
                rows in your database.
              </p>
              <p className="p">Policies can be written in SQL or using the dashboard online.</p>

              <Link href="/docs/guides/auth#policy-examples">
                <a>
                  <Button size="small" type="default" className="mt-4" icon={<IconArrowUpRight />}>
                    Explore documentation
                  </Button>
                </a>
              </Link>
            </div>
            <div className="col-span-12 lg:col-span-6 lg:col-start-7">
              <SplitCodeBlockCarousel
                // @ts-ignore
                content={AuthSqlRulesExamples}
              />
            </div>
          </div>
        </SectionContainer>

        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default RealtimePage
