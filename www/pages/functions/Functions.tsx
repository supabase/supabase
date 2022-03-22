import { createClient } from '@supabase/supabase-js'
import {
  Button,
  IconArrowUpRight,
  IconBriefcase,
  IconEye,
  IconKey,
  IconLink,
  IconShield,
  IconX,
  Space,
  Typography,
} from '@supabase/ui'
import ApiExamples from 'data/products/auth/auth-api-examples'
import AuthSqlRulesExamples from 'data/products/auth/auth-sql-rules-examples'
import Solutions from 'data/Solutions.json'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AuthComponentExample from '~/components/AuthWidget/AuthComponentExample'
import SplitCodeBlockCarousel from '~/components/Carousels/SplitCodeBlockCarousel'
import CTABanner from '~/components/CTABanner'
import FeatureColumn from '~/components/FeatureColumn'
import FloatingIcons from '~/components/FloatingIcons'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import APISection from '~/components/Sections/APISection'
import GithubExamples from '~/components/Sections/GithubExamples'
import ProductHeader from '~/components/Sections/ProductHeader'
import AuthProviders from '~/data/auth.json'

function FunctionsPage() {
  // base path for images
  const { basePath } = useRouter()

  // supabase auth widget project details
  const supabase = createClient(
    'https://rsnibhkhsbfnncjmwnkj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNTIxNDE1MywiZXhwIjoxOTMwNzkwMTUzfQ.OQEbAaTfgDdLCCht251P2JRD3QDnui6nsU8N-tZA_Mc'
  )

  const meta_title = 'Functions | Custom code and cron jobs without servers'
  const meta_description =
    'Functions make it possible to execute custom code and cron jobs in Supabase without scaling servers.'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/functions`,
          images: [
            {
              url: `https://supabase.com${basePath}/images/product/auth/auth-og.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <ProductHeader
          icon={Solutions['functions'].icon}
          title={Solutions['functions'].name}
          h1={[
            <span key={'authentication-h1'}>
            Run your cron jobs and custom code from Supabase!
            </span>,
          ]}
          subheader={[
            'With Functions you can reduce the complexity of your application footprint with Supabase.',
            "Unlock the ability to see the full scope of your application.",
          ]}
          image={[
            <div className="w-full header--light block" key="light">
              <Image
                src={`${basePath}/images/product/auth/header--light.png`}
                alt="auth header"
                layout="responsive"
                width="1372"
                height="1074"
              />
            </div>,
            <div className="w-full header--dark mr-0 dark:block" key="dark">
              <Image
                src={`${basePath}/images/product/auth/header--dark.png`}
                alt="auth header"
                layout="responsive"
                width="1372"
                height="1074"
              />
            </div>,
          ]}
          documentation_url={'/docs/guides/auth'}
        />

        <SectionContainer>
          <div className="grid grid-cols-12">
            <div className="mb-10 lg:mb-0 col-span-12 lg:col-span-3">
              <p className="mb-4">
                <div className="flex items-center flex-wrap xl:w-64">
                  <div className="mb-2 mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 32.58 31.77"
                      width={21}
                      className="text-gray-800 dark:text-white"
                    >
                      <path
                        fill="currentColor"
                        d="M16.29,0a16.29,16.29,0,0,0-5.15,31.75c.82.15,1.11-.36,1.11-.79s0-1.41,0-2.77C7.7,29.18,6.74,26,6.74,26a4.36,4.36,0,0,0-1.81-2.39c-1.47-1,.12-1,.12-1a3.43,3.43,0,0,1,2.49,1.68,3.48,3.48,0,0,0,4.74,1.36,3.46,3.46,0,0,1,1-2.18c-3.62-.41-7.42-1.81-7.42-8a6.3,6.3,0,0,1,1.67-4.37,5.94,5.94,0,0,1,.16-4.31s1.37-.44,4.48,1.67a15.41,15.41,0,0,1,8.16,0c3.11-2.11,4.47-1.67,4.47-1.67A5.91,5.91,0,0,1,25,11.07a6.3,6.3,0,0,1,1.67,4.37c0,6.26-3.81,7.63-7.44,8a3.85,3.85,0,0,1,1.11,3c0,2.18,0,3.94,0,4.47s.29.94,1.12.78A16.29,16.29,0,0,0,16.29,0Z"
                      />
                    </svg>
                  </div>
                </div>
              </p>
              <Typography.Title level={4}>Go beyond Postgres Functions</Typography.Title>
              <Typography.Text>
                <p className="text-base">
                  Interact with third-party APIs and asynchronous tasks within Supabase. You don't need to create or manage servers to run code on Supabase.
                </p>
              </Typography.Text>
            </div>
            <div className="mb-10 lg:mb-0 col-span-12 lg:col-span-3 lg:col-start-5">
              <Typography.Text>
                <p className="mb-4">
                  <IconLink />
                </p>
              </Typography.Text>
              <Typography.Title level={4}>Testing and tooling you ❤️</Typography.Title>
              <Typography.Text>
                <p className="text-base">
                  Use the Javascript tools, libraries, and frameworks you know and love to take action in your Postgres database.
                </p>
              </Typography.Text>
            </div>
            <div className="col-span-12 lg:col-span-3 lg:col-start-9">
              <Typography.Text>
                <p className="mb-4">
                  <IconShield />
                </p>
              </Typography.Text>
              <Typography.Title level={4}>Simplify your ecosystem</Typography.Title>
              <Typography.Text>
                <p className="text-base">
                  Ditch your application's custom API and condense your cloud footprint to fully run in Supabase.
                </p>
              </Typography.Text>
            </div>
          </div>
        </SectionContainer>

        <SectionContainer className="-mb-48">
          <APISection
            title="Improve performance"
            // @ts-ignore
            content={ApiExamples}
            size="large"
            text={[
              <Typography.Text key={0}>
                <p className="text-base lg:text-lg">
                  Stop waiting for your functions to run from cold start up and get raw compute performance with Supabase.
                </p>
              </Typography.Text>,
            ]}
            footer={[
              <div className="grid grid-cols-12 md:gap-8 lg:gap-0 xl:gap-16 mt-8" key={0}>
                <div className="col-span-12 sm:col-span-6 lg:col-span-12 xl:col-span-4">
                  <FeatureColumn
                    icon={<IconBriefcase />}
                    title="Deploy anywhere"
                    text="Host your functions wherever you like, use Supabase as your destination."
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 lg:col-span-12 xl:col-span-4">
                  <FeatureColumn
                    icon={<IconEye />}
                    title="Trusted providers"
                    text="Choose from Deno Deploy, Cloudflare workers, AWS Lambda, Fastly Compute@Edge, Fly.io, or Google CloudRun."
                  />
                </div>
              </div>,
            ]}
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
          <div className="grid grid-cols-12 lg:gap-16">
            <div className="col-span-12 lg:col-span-5 mb-8">
              <Typography.Title level={2}>Securely access your database</Typography.Title>
              <Typography.Text>
                <p className="text-base lg:text-lg">
                  Supabase Functions give you the ability to privately connect to your database and serve your data, all without having to worry about scaling servers.
                </p>
              </Typography.Text>
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

export default FunctionsPage
