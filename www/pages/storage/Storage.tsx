import {
  Badge,
  Button,
  IconArrowUpRight,
  IconBarChart,
  IconCheckSquare,
  IconShuffle,
  IconWifi,
  IconX,
  Space,
  Typography,
} from '@supabase/ui'
import ApiExamples from 'data/products/storage/api-examples'
import DashboardViewData from 'data/products/storage/dashboard-carousel.json'
import StoragePermissionsData from 'data/products/storage/permissions-examples'
import Solutions from 'data/Solutions.json'
import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import ImageCarousel from '~/components/Carousels/ImageCarousel'
import SplitCodeBlockCarousel from '~/components/Carousels/SplitCodeBlockCarousel'
import CTABanner from '~/components/CTABanner'
import ExampleCard from '~/components/ExampleCard'
import FeatureColumn from '~/components/FeatureColumn'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import ProductIcon from '~/components/ProductIcon'
import APISection from '~/components/Sections/APISection'
import ProductHeader from '~/components/Sections/ProductHeader'

function StoragePage() {
  // base path for images
  const { basePath } = useRouter()

  const meta_title = 'Storage | Store any digital content'
  const meta_description =
    'An open source Object store with unlimited scalability, for any file type.'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.io/storage`,
          images: [
            {
              url: `https://supabase.io${basePath}/images/product/storage/storage-og.jpg`,
            },
          ],
        }}
      />
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
            'An open source Object store with unlimited scalability, for any file type.',
            'With custom policies and permissions that are familiar and easy to implement.',
          ]}
          image={[
            <div className="w-full header--light block">
              <Image
                src={`${basePath}/images/product/storage/header--light.png`}
                alt="storage header"
                layout="responsive"
                width="1386"
                height="1067"
              />
            </div>,
            <div className="w-full header--dark mr-0 dark:block">
              <Image
                src={`${basePath}/images/product/storage/header--dark.png`}
                alt="storage header"
                layout="responsive"
                width="1386"
                height="1067"
              />
            </div>,
          ]}
        />

        <SectionContainer>
          <div className="grid grid-cols-12">
            <div className="mb-10 lg:mb-0 col-span-12 lg:col-span-3">
              <Typography.Text>
                <p className="mb-4">
                  <Space>
                    <ProductIcon icon={Solutions['storage'].icon} />
                    <IconX />
                    <ProductIcon icon={Solutions['authentication'].icon} />
                    <IconX />
                    <ProductIcon icon={Solutions['database'].icon} />
                  </Space>
                </p>
              </Typography.Text>
              <Typography.Title level={4}>Interoperable</Typography.Title>
              <Typography.Text>
                <p className="text-lg">
                  Integrates well with the rest of Supabase ecosystem, including Auth and Postgres.
                </p>
                {/* <p>
                Familiar and easy to use permissions mean that your content is secure and accessible
                only to the right users
              </p> */}
              </Typography.Text>
            </div>
            <div className="mb-10 lg:mb-0 col-span-12 lg:col-span-3 lg:col-start-5">
              <Typography.Text>
                <p>
                  <Space>
                    <ProductIcon
                      icon={
                        'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                      }
                    />
                  </Space>
                </p>
              </Typography.Text>
              <Typography.Title level={4}>Lightning fast</Typography.Title>
              <Typography.Text>
                <p className="text-lg">
                  Thin API server layer that leverages Postgres' permissions and performance.
                </p>
                {/* <p>
                1.3x faster than XXX, your content can be delivered anywhere in the world at the
                speed you expect.
              </p> */}
              </Typography.Text>
            </div>
            <div className="col-span-12 lg:col-span-3 lg:col-start-9">
              <Typography.Text>
                <p>
                  <Space>
                    <ProductIcon
                      icon={
                        'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                      }
                    />
                  </Space>
                </p>
              </Typography.Text>
              <Typography.Title level={4}>Dependable</Typography.Title>
              <Typography.Text>
                <p className="text-lg">Enterprise-level scalability and durability.</p>
                {/* <p>A durability rating of 99.999999999%.</p> */}
              </Typography.Text>
            </div>
          </div>
        </SectionContainer>

        <SectionContainer className="pt-16">
          <div className="mb-16 block">
            <Typography.Title>Sleek dashboard for managing your media</Typography.Title>
            <Typography.Text>
              <p className="text-lg">
                A complete Object Explorer so that any of your team can use.
              </p>
              <p>
                Drag and drop uploading, moving objects, and multiple object selection. As easy as
                working on your desktop.
              </p>
            </Typography.Text>
          </div>
          <ImageCarousel
            // @ts-ignore
            content={DashboardViewData}
            footer={[
              <Typography.Title level={4}>Check out our example app</Typography.Title>,
              // !! Update this example !!
              <ExampleCard
                type={'example'}
                products={['database', 'auth', 'storage']}
                title={'Profile management example'}
                description={
                  'Update a user account with public profile information, including uploading a profile image.'
                }
                author={'supabase'}
                author_url={'https://github.com/supabase'}
                author_img={'https://avatars.githubusercontent.com/u/54469796'}
                repo_name={'nextjs-ts-user-management'}
                repo_url={
                  'https://github.com/supabase/supabase/tree/master/examples/nextjs-ts-user-management'
                }
                vercel_deploy_url={
                  'https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fsupabase%2Fsupabase%2Ftree%2Fmaster%2Fexamples%2Fnextjs-ts-user-management&project-name=supabase-user-management&repository-name=supabase-user-management&demo-title=Supabase%20User%20Management&demo-description=An%20example%20web%20app%20using%20Supabase%20and%20Next.js&demo-url=https%3A%2F%2Fsupabase-nextjs-ts-user-management.vercel.app&demo-image=https%3A%2F%2Fi.imgur.com%2FZ3HkQqe.png&integration-ids=oac_jUduyjQgOyzev1fjrW83NYOv&external-id=nextjs-user-management'
                }
                demo_url={''}
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
              <p>Built from the ground-up for interoperable authentication.</p>,
              <p>
                Fast and easy to implement using our powerful library clients. Asset optimization
                and image transformation coming soon!
              </p>,
            ]}
            footer={[
              <div className="grid grid-cols-12 gap-8 lg:gap-0 xl:gap-16 my-8">
                <div className="col-span-6 lg:col-span-12 lg:mb-8 xl:mb-0 xl:col-span-4">
                  <FeatureColumn
                    icon={<IconWifi />}
                    title="CDN"
                    text="Serve from the edge to reduce latency."
                  />
                  <Badge color="blue">Coming soon</Badge>
                </div>
                <div className="col-span-6 lg:col-span-12 xl:col-span-4">
                  <FeatureColumn
                    icon={<IconShuffle />}
                    title="Transformations"
                    text="Resize and compress your media before you serve it."
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
                        with Supabase Auth
                      </Typography.Title>
                      <Typography.Text>
                        <p className="">
                          Using Postgres Row Level Security to create Object access rules.
                        </p>
                        <p>
                          Storage Authorization is built around Postgres so that you can use any
                          combination of SQL, Postgres functions, and even your own metadata to
                          write policies.
                        </p>
                      </Typography.Text>
                      <Link
                        href="https://supabase.io/docs/reference/javascript/storage-createbucket"
                        as="https://supabase.io/docs/reference/javascript/storage-createbucket"
                      >
                        <a>
                          <Button
                            size="small"
                            type="default"
                            className="mt-4"
                            icon={<IconArrowUpRight />}
                          >
                            Explore documentation
                          </Button>
                        </a>
                      </Link>
                    </div>
                    <div className="col-span-12 lg:col-span-6 lg:col-start-7">
                      <SplitCodeBlockCarousel
                        // @ts-ignore
                        content={StoragePermissionsData}
                      />
                    </div>
                  </div>
                </SectionContainer>
              </div>
            </div>
          </div>
        </div>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default StoragePage
