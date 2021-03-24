import { useRouter } from 'next/router'

import {
  Button,
  Auth,
  Badge,
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
  IconShuffle,
  IconWifi,
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

import ApiExamples from 'data/products/database/api-examples'
import StoragePermissionsData from 'data/products/storage/permissions-examples'

import CTABanner from '~/components/CTABanner'

import Solutions from 'data/Solutions.json'
import ImageCarousel from '~/components/Carousels/ImageCarousel'
import TweetCard from '~/components/TweetCard'

import TableViewCarouselData from 'data/products/database/table-view-carousel.json'
import ExampleCard from '~/components/ExampleCard'

function AuthPage() {
  // base path for images
  const { basePath } = useRouter()

  // supabase auth widget project details
  const supabase = createClient(
    'https://rsnibhkhsbfnncjmwnkj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNTIxNDE1MywiZXhwIjoxOTMwNzkwMTUzfQ.OQEbAaTfgDdLCCht251P2JRD3QDnui6nsU8N-tZA_Mc'
  )

  return (
    <DefaultLayout>
      <ProductHeader
        icon={Solutions['storage'].icon}
        title={Solutions['storage'].name}
        h1={[
          <span>
            Store and serve
            <br /> any type of digital content
          </span>,
        ]}
        subheader={[
          'An open source scalable object store, capable of holding any file and file size you like.',
          'With custom policies and permissions that are familair, easy to implement and unlimited scalable storage.',
        ]}
        image={[
          <img
            className="w-full header--light block"
            src={`${basePath}/images/product/auth/header--light.png`}
          />,
          <img
            className="w-full header--dark mr-0 dark:block"
            src={`${basePath}/images/product/auth/header--dark.png`}
          />,
        ]}
      />

      <SectionContainer>
        <div className="grid grid-cols-12">
          <div className="col-span-3">
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
            <Typography.Title level={4}>Write less code</Typography.Title>
            <Typography.Text>
              <p className="text-lg">
                Use media in your project without needing to reply on external services or learn new
                frameworks.
              </p>
              <p>
                Familiar and easy to use permissions mean that your content is secure and accessible
                only to the right users
              </p>
            </Typography.Text>
          </div>
          <div className="col-span-3 col-start-5">
            <p className="mb-4">
              <IconLink />
            </p>
            <Typography.Title level={4}>Blazing fast</Typography.Title>
            <Typography.Text>
              <p className="text-lg">API server is a thin layer built on Fasitfy.</p>
              <p>
                1.3x faster than XXX, your content can be delivered anywhere in the world at the
                speed you expect.
              </p>
            </Typography.Text>
          </div>
          <div className="col-span-3 col-start-9">
            <p className="mb-4">
              <IconShield />
            </p>
            <Typography.Title level={4}>Dependable</Typography.Title>
            <Typography.Text>
              <p className="text-lg">
                Enterprise level uptime with automatic backups of your content kept and maintained
                all by Supabase.A durability rating of 99.999999999%.
              </p>
            </Typography.Text>
          </div>
        </div>
      </SectionContainer>

      <SectionContainer className="pt-16">
        <div className="mb-16 block">
          <Typography.Title>Sleek dashboard for managing your media</Typography.Title>
          <p className="text-lg">
            We provide a full storage explorer so any of your team can easily traverse content and
            files.
          </p>
          <p>
            Simple drag and drop uploading, file moving and multiple file selection so it’s as easy
            as working on your desktop.
          </p>
        </div>
        <ImageCarousel
          // @ts-ignore
          content={TableViewCarouselData}
          footer={[
            <Typography.Title level={4}>Check out our example app</Typography.Title>,
            // !! Update this example !!
            <ExampleCard
              type={'example'}
              products={['database']}
              title={'Profile managment example'}
              description={'NextJS Slack clone app using Supabase realtime subscriptions'}
              author={'supabase'}
              author_url={'https://github.com/supabase'}
              author_img={'https://avatars.githubusercontent.com/u/54469796'}
              repo_name={'update-this-example'}
              repo_url={
                'https://github.com/supabase/supabase/tree/master/examples/nextjs-slack-clone'
              }
              vercel_deploy_url={''}
              demo_url={'https://supabase-slack-clone-supabase.vercel.app/'}
            />,
          ]}
        />
      </SectionContainer>

      <SectionContainer className="-mb-48 pt-0">
        <APISection
          title="Simple and convenient APIs"
          // @ts-ignore
          content={ApiExamples}
          text={[
            <p>
              An API built from the groud up for server and client side authentication that is fast
              to implement.
            </p>,
            <p>
              With powerful library clients coming soon that allow for asset optimasation and image
              transformation
            </p>,
          ]}
          footer={[
            <div className="grid grid-cols-12 gap-8 lg:gap-0 xl:gap-16 mt-8">
              <div className="col-span-6 lg:col-span-12 lg:mb-8 xl:mb-0 xl:col-span-4">
                <FeatureColumn
                  icon={<IconWifi />}
                  title="CDN integration"
                  text="Request any kind of media in any format and size you like."
                />
                <Badge color="blue">Coming soon</Badge>
              </div>
              <div className="col-span-6 lg:col-span-12 xl:col-span-4">
                <FeatureColumn
                  icon={<IconShuffle />}
                  title="Auto transformation & optimisation"
                  text="Request any kind of media in any format and size you like."
                />
                <Badge color="blue">Coming soon</Badge>
              </div>
            </div>,
          ]}
        />
      </SectionContainer>

      <div className="relative">
        <div className="section--masked">
          <div className="section--bg-masked">
            <div className="section--bg border-t border-gray-100 dark:border-gray-600"></div>
          </div>
          <div className="section-container pt-12 pb-0">
            {/* <FloatingIcons /> */}
            <div className="overflow-x-hidden">
              {/* <SectionContainer className="mb-0 pb-8">
                <GithubExamples />
              </SectionContainer> */}

              <SectionContainer>
                <div className="grid grid-cols-12 lg:gap-16">
                  <div className="col-span-12 lg:col-span-5 mb-8">
                    <Typography.Title level={2}>
                      Integrates natively <br />
                      with Supabase Auth{' '}
                    </Typography.Title>
                    <p className="text-lg">
                      Why learn another syntax for writing policies when you can use the same SQL
                      you use for your database permissions.
                    </p>
                    <p>
                      Use any combination of postgres function, helper functions and even your own
                      metadata to write any policy.
                    </p>
                    <Button
                      size="small"
                      type="default"
                      className="mt-4"
                      icon={<IconArrowUpRight />}
                    >
                      Expore documentation
                    </Button>
                  </div>
                  <div className="col-span-12 lg:col-span-6 lg:col-start-7">
                    <SplitCodeBlockCarousel content={StoragePermissionsData} />
                  </div>
                </div>
              </SectionContainer>
            </div>
          </div>
        </div>
      </div>
      <CTABanner />
    </DefaultLayout>
  )
}

export default AuthPage
