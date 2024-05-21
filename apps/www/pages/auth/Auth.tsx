import { Button, IconArrowUpRight, IconBriefcase, IconEye, IconLink, IconShield } from 'ui'
import ApiExamples from 'data/products/auth/auth-api-examples'
import AuthSqlRulesExamples from 'data/products/auth/auth-sql-rules-examples'
import Solutions from 'data/Solutions'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AuthWidgetSection from '~/components/AuthWidget/AuthWidgetSection'
import SplitCodeBlockCarousel from '~/components/Carousels/SplitCodeBlockCarousel'
import CTABanner from '~/components/CTABanner'
import FeatureColumn from '~/components/FeatureColumn'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import APISection from '~/components/Sections/APISection'
import GithubExamples from '~/components/Sections/GithubExamples'
import ProductHeader from '~/components/Sections/ProductHeader'
import AuthProviders from '~/data/auth.json'
import { ThemeImage } from 'ui-patterns/ThemeImage'
import ProductsNav from '~/components/Products/ProductsNav'
import { PRODUCT_NAMES } from 'shared-data/products'

function AuthPage() {
  // base path for images
  const { basePath } = useRouter()

  const meta_title = 'Auth | Built-in user management'
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
          url: `https://supabase.com/auth`,
          images: [
            {
              url: `https://supabase.com${basePath}/images/product/auth/auth-og.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <ProductsNav activePage={PRODUCT_NAMES.AUTHENTICATION} />
        <ProductHeader
          icon={Solutions['authentication'].icon}
          title={Solutions['authentication'].name}
          h1={[
            <span key={'authentication-h1'}>
              Open Source Auth
              <br /> (with tons of integrations)
            </span>,
          ]}
          subheader={[
            'Every Supabase project comes with a complete User Management system that works without any additional tools.',
            "Including PostgreSQL's policy engine, for fine-grained access rules.",
          ]}
          image={[
            <ThemeImage
              src={{
                light: `${basePath}/images/product/auth/header--light.png`,
                dark: `${basePath}/images/product/auth/header--dark.png`,
              }}
              alt="auth header"
              layout="responsive"
              width="1372"
              height="1074"
            />,
          ]}
          documentation_url={'/docs/guides/auth'}
        />

        <SectionContainer>
          <div className="grid grid-cols-12">
            <div className="col-span-12 mb-10 lg:col-span-3 lg:mb-0">
              <div className="mb-4 -mt-[1.9rem]">
                <div className="grid grid-flow-col grid-rows-2 gap-2 xl:w-64">
                  <div className="flex w-fit items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 32.58 31.77"
                      width={21}
                      height={21}
                      className="text-foreground-light"
                    >
                      <path
                        fill="currentColor"
                        d="M16.29,0a16.29,16.29,0,0,0-5.15,31.75c.82.15,1.11-.36,1.11-.79s0-1.41,0-2.77C7.7,29.18,6.74,26,6.74,26a4.36,4.36,0,0,0-1.81-2.39c-1.47-1,.12-1,.12-1a3.43,3.43,0,0,1,2.49,1.68,3.48,3.48,0,0,0,4.74,1.36,3.46,3.46,0,0,1,1-2.18c-3.62-.41-7.42-1.81-7.42-8a6.3,6.3,0,0,1,1.67-4.37,5.94,5.94,0,0,1,.16-4.31s1.37-.44,4.48,1.67a15.41,15.41,0,0,1,8.16,0c3.11-2.11,4.47-1.67,4.47-1.67A5.91,5.91,0,0,1,25,11.07a6.3,6.3,0,0,1,1.67,4.37c0,6.26-3.81,7.63-7.44,8a3.85,3.85,0,0,1,1.11,3c0,2.18,0,3.94,0,4.47s.29.94,1.12.78A16.29,16.29,0,0,0,16.29,0Z"
                      />
                    </svg>
                  </div>
                  {AuthProviders.map((auth, i) => {
                    return (
                      <div className="flex w-fit items-center" key={i}>
                        <Image
                          src={`${basePath}/images/product/auth/${auth.name}-icon.svg`}
                          alt={`${auth.name} auth login icon`}
                          key={auth.name}
                          height={21}
                          width={21}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
              <h4 className="h4">All the social providers</h4>
              <p className="p text-base">
                Enable social logins with the click of a button. Google, Facebook, GitHub, Azure
                (Microsoft), Gitlab, Twitter, Discord, and many more.
              </p>
            </div>
            <div className="col-span-12 mb-10 lg:col-span-3 lg:col-start-5 lg:mb-0">
              <div className="p mb-4">
                <IconLink />
              </div>
              <h4 className="h4">Fully integrated</h4>
              <p className="p text-base">
                Incredibly simple Auth, without a single external authentication service. Built-in
                Authentication, Authorization, and User Management.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-3 lg:col-start-9">
              <div className="p mb-4">
                <IconShield />
              </div>
              <h4 className="h4">Own your data</h4>
              <p className="p text-base">
                User data stored in your Supabase database so you never have to worry about 3rd
                party privacy issues. Host your data in 8 different locations.
              </p>
            </div>
          </div>
        </SectionContainer>

        <SectionContainer className="-mb-48">
          <APISection
            title="Simple APIs"
            // @ts-ignore
            content={ApiExamples}
            size="large"
            text={[
              <p key={0}>
                <p className="text-base lg:text-lg">
                  APIs that you can understand. With powerful libraries that work on client and
                  server-side applications.
                </p>
                {/* I think less is more here ... */}
                {/* <p>
                  With powerful client libraries that work on both client and server-side
                  applications.
                </p> */}
              </p>,
            ]}
            footer={[
              <div className="mt-8 grid grid-cols-12 md:gap-8 lg:gap-0 xl:gap-16" key={0}>
                <div className="col-span-12 sm:col-span-6 lg:col-span-12 xl:col-span-4">
                  <FeatureColumn
                    icon={<IconBriefcase />}
                    title="Enterprise logins"
                    text="Support for SAML, Azure. More enterprise providers and SSO coming soon."
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 lg:col-span-12 xl:col-span-4">
                  <FeatureColumn
                    icon={<IconEye />}
                    title="Social login scopes"
                    text="Request additional user data permissions when using social logins."
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
              <div className="section--bg border-t border-b border-control"></div>
            </div>
            <div className="section-container pt-12 pb-0">
              <div className="overflow-x-hidden">
                <SectionContainer className="mb-0 pb-8">
                  <GithubExamples />
                </SectionContainer>
              </div>
            </div>
          </div>
        </div>

        <SectionContainer>
          <div className="grid grid-cols-12 lg:mt-16 lg:gap-16">
            <div className="col-span-12 mb-8 lg:col-span-5">
              <h2 className="h3">User permissions without the middleware</h2>

              <p className="p text-base lg:text-lg">
                Supabase Auth works without any additional servers. Build Authorization rules with
                Postgres' Row Level Security, controlling who can create, edit and delete specific
                rows in your database.
              </p>
              <p className="p">Policies can be written in SQL or using the dashboard online.</p>

              <Button
                asChild
                size="small"
                type="default"
                className="mt-4"
                icon={<IconArrowUpRight />}
              >
                <Link href="/docs/guides/auth#policy-examples">Explore documentation</Link>
              </Button>
            </div>
            <div className="col-span-12 lg:col-span-6 lg:col-start-7">
              <SplitCodeBlockCarousel
                // @ts-ignore
                content={AuthSqlRulesExamples}
              />
            </div>
          </div>
        </SectionContainer>

        <AuthWidgetSection />

        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default AuthPage
