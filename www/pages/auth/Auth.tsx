import { useRouter } from 'next/router'

import {
  Button,
  Auth,
  Card,
  Space,
  Tabs,
  Typography,
  IconCode,
  IconZoomIn,
  IconCopy,
  IconKey,
  IconBriefcase,
  IconEye,
  IconX,
  IconDatabase,
  IconShield,
  IconLink,
  IconArrowUpRight,
} from '@supabase/ui'
import { createClient } from '@supabase/supabase-js'
import DefaultLayout from '~/components/Layouts/Default'

import CodeBlock from '~/components/CodeBlock/CodeBlock'
import ProductHeader from '~/components/Sections/ProductHeader'
import SectionContainer from '~/components/Layouts/SectionContainer'

import SplitCodeBlockCarousel from '~/components/Carousels/SplitCodeBlockCarousel'
import APISection from '~/components/Sections/APISection'
import GithubExamples from '~/components/Sections/GithubExamples'
import FeatureColumn from '~/components/FeatureColumn'
import FloatingIcons from '~/components/FloatingIcons'

import ApiExamples from 'data/products/auth/auth-api-examples'
import AuthSqlRulesExamples from 'data/products/auth/auth-sql-rules-examples'

import CTABanner from '~/components/CTABanner'

import Solutions from 'data/Solutions.json'
import AuthComponentExample from '~/components/AuthWidget/AuthComponentExample'
import Link from 'next/link'
import { NextSeo } from 'next-seo'

function AuthPage() {
  // base path for images
  const { basePath } = useRouter()

  // supabase auth widget project details
  const supabase = createClient(
    'https://rsnibhkhsbfnncjmwnkj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNTIxNDE1MywiZXhwIjoxOTMwNzkwMTUzfQ.OQEbAaTfgDdLCCht251P2JRD3QDnui6nsU8N-tZA_Mc'
  )

  const meta_title = 'Auth | Built-in user mangement'
  const meta_description =
    'Authentication that you can afford that is built in to your supabase project.'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `${basePath}/auth`,
          images: [
            {
              url: `https://supabase.io/${basePath}/images/product/auth/auth-og.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <ProductHeader
          icon={Solutions['authentication'].icon}
          title={Solutions['authentication'].name}
          h1={[
            <span key={'authentication-h1'}>
              Built-in user mangement
              <br /> (that you can afford)
            </span>,
          ]}
          subheader={[
            'An open source scalable object store, capable of holding any file and file size you like.',
            'With custom policies and permissions that are familair, easy to implement and unlimited scalable storage.',
          ]}
          image={[
            <img
              key={'authentication-header-img--light'}
              className="w-full header--light block"
              src={`${basePath}/images/product/auth/header--light.png`}
            />,
            <img
              key={'authentication-header-img--dark'}
              className="w-full header--dark mr-0 dark:block"
              src={`${basePath}/images/product/auth/header--dark.png`}
            />,
          ]}
          documentation_url={'https://supabase.io/docs/guides/auth'}
        />

        <SectionContainer>
          <div className="grid grid-cols-12">
            <div className="mb-10 lg:mb-0 col-span-12 lg:col-span-3">
              <p className="mb-4">
                <Space>
                  <img src={`${basePath}/images/product/auth/google-icon.svg`} width={21} />
                  <img src={`${basePath}/images/product/auth/facebook-icon.svg`} width={21} />
                  <div>
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
                  <img src={`${basePath}/images/product/auth/gitlab-icon.svg`} width={21} />
                  <img src={`${basePath}/images/product/auth/bitbucket-icon.svg`} width={21} />
                </Space>
              </p>
              <Typography.Title level={4}>All the social providers</Typography.Title>
              <Typography.Text>
                <p className="text-base lg:text-lg">
                  We provide all the popular social logins you expect. Google, Facebook, Github,
                  Azure, Gitlab and Bitbucket.
                </p>
                <Space>
                  <img src={`${basePath}/images/product/auth/twitter-icon.svg`} width={21} />
                  <p className="m-0">
                    <span className="text-gray-800 dark:text-white">Twitter</span> coming soon
                  </p>
                </Space>
              </Typography.Text>
            </div>
            <div className="mb-10 lg:mb-0 col-span-12 lg:col-span-3 lg:col-start-5">
              <p className="mb-4">
                <IconLink />
              </p>
              <Typography.Title level={4}>Fully integrated</Typography.Title>
              <Typography.Text>
                <p className="text-base lg:text-lg">
                  Auth built into your project, with no need for external authentication services.
                </p>
                <p>Use your own custom domains with SMTP settings.</p>
              </Typography.Text>
            </div>
            <div className="col-span-12 lg:col-span-3 lg:col-start-9">
              <p className="mb-4">
                <IconShield />
              </p>
              <Typography.Title level={4}>Own your data</Typography.Title>
              <Typography.Text>
                <p className="text-base lg:text-lg">
                  Keep all your user data in your supabase project so you never have to worry about
                  3rd party privacy issues.
                </p>
                <p>Supabase is GDPR / CPA Compliant.</p>
              </Typography.Text>
            </div>
          </div>
        </SectionContainer>

        <SectionContainer className="-mb-48">
          <APISection
            title="Simple and convenient APIs"
            // @ts-ignore
            content={ApiExamples}
            size="large"
            text={[
              <Typography.Text>
                <p className="text-base lg:text-lg">
                  An API built from the groud up for server and client side authentication that is
                  fast to implement.
                </p>
                <p>
                  With powerful library clients coming soon that allow for asset optimasation and
                  image transformation
                </p>
              </Typography.Text>,
            ]}
            footer={[
              <div className="grid grid-cols-12 md:gap-8 lg:gap-0 xl:gap-16 mt-8">
                <div className="col-span-12 sm:col-span-6 lg:col-span-12 xl:col-span-4">
                  <FeatureColumn
                    icon={<IconBriefcase />}
                    title="Enterprise logins"
                    text="Support for SAML, Azure, and Okta."
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 lg:col-span-12 xl:col-span-4">
                  <FeatureColumn
                    icon={<IconEye />}
                    title="Social login scopes"
                    text="Request additonal user data permissions when using social logins"
                  />
                </div>
              </div>,
            ]}
            documentation_link={'https://supabase.io/docs/guides/auth'}
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
              <Typography.Title level={2}>No middleware user permission</Typography.Title>
              <Typography.Text>
                <p className="text-base lg:text-lg">
                  Restrict user access with row level security, even without prior knowledge of SQL.
                  Control who can create, edit and delete specific rows in your database.
                </p>
                <p>Polcies can be written in SQL or using the dashboard online.</p>
              </Typography.Text>
              <Link href="https://supabase.io/docs/guides/auth#policy-examples">
                <a>
                  <Button size="small" type="default" className="mt-4" icon={<IconArrowUpRight />}>
                    Expore documentation
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

        <SectionContainer>
          <div className="grid grid-cols-12 lg:gap-16">
            <div className="order-last col-span-12 lg:order-first lg:col-span-6 mt-8 lg:mt-0">
              <AuthComponentExample />
            </div>
            <div className="col-span-12 lg:col-span-6 lg:col-start-7 xl:col-span-4 xl:col-start-8">
              <Space className="mb-4">
                <div className="w-8 h-8 rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900  flex justify-center items-center">
                  <IconKey size="small" strokeWidth={1.5} />
                </div>
                <Typography.Text type="secondary">
                  <IconX />
                </Typography.Text>
                <img className="w-8" src={`${basePath}/images/product/auth/react-icon.svg`} />
              </Space>

              <Typography.Title level={2} className="mb-4">
                React Auth component
              </Typography.Title>
              <Typography.Text>
                <p className="text-base lg:text-lg">
                  Bring authentication to your React app without coding a single form.
                </p>
                <p>
                  We provide a React component that handles all the usual needs for logging in,
                  signing up, magic link and forgot password forms.
                </p>
              </Typography.Text>
              <Link
                href="https://github.com/supabase/ui#using-supabase-ui-auth"
                as="https://github.com/supabase/ui#using-supabase-ui-auth"
              >
                <a>
                  <Button size="small" type="default" className="mt-4" icon={<IconArrowUpRight />}>
                    Explore documentation
                  </Button>
                </a>
              </Link>

              <div className="grid grid-cols-12 md:gap-8 lg:gap-0 xl:gap-16 mt-8">
                <div className="col-span-12 lg:col-span-12 xl:col-span-4">
                  <FeatureColumn
                    icon={<IconBriefcase />}
                    title="Social login support"
                    text="Support for social logins are built in and the component "
                  />
                </div>
                <div className="col-span-12 lg:col-span-12 xl:col-span-4">
                  <FeatureColumn
                    icon={<IconEye />}
                    title="User context"
                    text="Includes a React hook that provides a user session context provider so you can display the right parts of your app for logged in users."
                  />
                </div>
              </div>
            </div>
          </div>
        </SectionContainer>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default AuthPage
