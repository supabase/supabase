import { useRouter } from 'next/router'

import {
  Button,
  Badge,
  Space,
  Typography,
  IconX,
  IconArrowUpRight,
  IconShuffle,
  IconWifi,
  IconCheckSquare,
  IconBarChart,
} from '@supabase/ui'
import { createClient } from '@supabase/supabase-js'
import DefaultLayout from '~/components/Layouts/Default'

import ProductHeader from '~/components/Sections/ProductHeader'
import SectionContainer from '~/components/Layouts/SectionContainer'

import SplitCodeBlockCarousel from '~/components/Carousels/SplitCodeBlockCarousel'
import APISection from '~/components/Sections/APISection'

import FeatureColumn from '~/components/FeatureColumn'

import ApiExamples from 'data/products/database/api-examples'
import StoragePermissionsData from 'data/products/storage/permissions-examples'

import CTABanner from '~/components/CTABanner'

import Solutions from 'data/Solutions.json'
import ImageCarousel from '~/components/Carousels/ImageCarousel'

import DashboardViewData from 'data/products/storage/dashboard-carousel.json'
import ExampleCard from '~/components/ExampleCard'
import ProductIcon from '~/components/ProductIcon'

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
            src={`${basePath}/images/product/storage/header--light.png`}
          />,
          <img
            className="w-full header--dark mr-0 dark:block"
            src={`${basePath}/images/product/storage/header--dark.png`}
          />,
        ]}
      />

      <SectionContainer>
        <div className="grid grid-cols-12">
          <div className="col-span-3">
            <p className="mb-4">
              <Space>
                <ProductIcon icon={Solutions['storage'].icon} />
                <IconX />
                <ProductIcon icon={Solutions['authentication'].icon} />
                <IconX />
                <ProductIcon icon={Solutions['database'].icon} />
              </Space>
            </p>
            <Typography.Title level={4}>Write less code</Typography.Title>
            <Typography.Text>
              <p className="text-lg">
                Use media in your project without needing to rely on external services or learn new
                frameworks - integrates with supabase Auth and Database.
              </p>
              <p>
                Familiar and easy to use permissions mean that your content is secure and accessible
                only to the right users
              </p>
            </Typography.Text>
          </div>
          <div className="col-span-3 col-start-5">
            <p className="mb-4">
              <IconBarChart />
            </p>
            <Typography.Title level={4}>Lighting fast</Typography.Title>
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
              <IconCheckSquare />
            </p>
            <Typography.Title level={4}>Dependable</Typography.Title>
            <Typography.Text>
              <p className="text-lg">
                Enterprise level uptime with automatic backups of your content kept and maintained
                all by Supabase.
              </p>
              <p>A durability rating of 99.999999999%.</p>
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
          content={DashboardViewData}
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
              vercel_deploy_url={'a'}
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
                      with supabase Auth
                    </Typography.Title>
                    <p className="text-lg">
                      No need to learn syntax for writing policies when you can use the same SQL you
                      use for your database permissions.
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
