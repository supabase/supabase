import Layout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import Panel from '~/components/Panel'
import { breadcrumbs } from '~/lib/breadcrumbs'
import { breadcrumbListSchema, serializeJsonLd } from '~/lib/json-ld'
import CTABanner from 'components/CTABanner/index'
import ImageGrid from 'components/ImageGrid'
import SectionHeader from 'components/UI/SectionHeader'
import CommunityData from 'data/Community'
import CompaniesData from 'data/Companies'
import InvestorData from 'data/Investors'
import PressData from 'data/Press'
import { NextSeo } from 'next-seo'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, Card, CardContent, CardHeader, CardTitle, Space } from 'ui'

type Props = {}

const Index = ({}: Props) => {
  const router = useRouter()

  const meta_title = "One of the world's fastest-growing open source communities | Supabase"
  const meta_description =
    'Supabase is the community that builds the infrastructure for your applications. Build using Supabase for any size project—from a new startup to even large growing companies'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/${router.pathname}`,
          images: [
            {
              url: `https://supabase.com/images/og/supabase-og.png`,
            },
          ],
        }}
      />
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(breadcrumbListSchema(breadcrumbs.company)),
          }}
        />
      </Head>
      <Layout>
        <Header />
        <Community />
        <Investors />
        <Press />
        <Team />
        <CTABanner />
      </Layout>
    </>
  )
}

export default Index

const Header = () => {
  return (
    <>
      <div
        className="
          sm:py-18
          container relative mx-auto px-6 py-16 text-center md:py-24 lg:px-16 lg:py-24
          xl:px-20"
      >
        <h1 className="text-foreground text-5xl">
          Join one of the world's fastest growing open source communities.
        </h1>
      </div>
    </>
  )
}

const Team = () => {
  return (
    <div className="border-t border-default">
      <SectionContainer>
        <SectionHeader title="Team" />
        <div className="grid grid-cols-2 md:grid-cols-12">
          <div className="col-span-8 ">
            <p className="text-foreground text-lg">
              Supabase is fully remote, with a strong affinity for open source maintainers and
              ex-Founders. Our engineering team is made up of developers from AWS, Google, Palantir,
              Stripe, and other YC companies.
            </p>
          </div>
          <div className=" col-span-4 pt-8 md:mt-0 md:text-right">
            <a href="https://supabase.com/careers">
              <Button size="medium" className="text-white">
                Join the team
              </Button>
            </a>
          </div>
        </div>
      </SectionContainer>
    </div>
  )
}

const Community = () => {
  const { basePath } = useRouter()

  return (
    <SectionContainer className="pt-0 lg:pt-0">
      <div className="space-y-16">
        <div className="relative grid max-w-5xl grid-cols-2 gap-8 lg:grid-cols-4 ">
          {CommunityData.map((x, i) => (
            <div
              key={x.title}
              className={`
              space-y-4 text-center lg:text-left
              ${i !== CommunityData.length - 1 ? 'border-default lg:border-r' : ''}
              ${i === 1 ? 'border-default md:border-0 lg:border-r ' : ''}
          `}
            >
              <div
                className={`relative mx-auto h-7 w-7 lg:mx-0 ${
                  x.invertImgDarkMode ? ' dark:invert dark:filter' : ''
                }`}
              >
                <Image
                  layout="fill"
                  alt={`${x.title} logo`}
                  src={`${basePath}/images/company/community/${x.img}`}
                  objectFit="scale-down"
                  objectPosition="center"
                  className="
                      bg-no-repeat
                  "
                />
              </div>
              <div>
                <h1 className="text-foreground mb-0 text-4xl">{x.stat}</h1>
                <p className="text-foreground-light text-sm">{x.statLabel}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-8">
          <div className="max-w-3xl">
            <p className="text-foreground-light text-sm">
              With developer signups from the world's leading brands.
            </p>
          </div>

          <ImageGrid images={CompaniesData} />
        </div>
      </div>
    </SectionContainer>
  )
}

const Investors = () => {
  return (
    <SectionContainer className="pt-0 lg:pt-0">
      <div id="investors">
        <SectionHeader
          title="Our investors"
          paragraph={
            <>
              We've raised over $116 million in funding, backed by some of the world's leading
              investors.
            </>
          }
        />
      </div>

      <div className="mx-auto mt-5 mb-16 grid max-w-lg gap-0.5 lg:max-w-none lg:grid-cols-4">
        {InvestorData.filter((x) => x.lead === true).map((x) => (
          <div key={x.name}>
            <div
              className="
              bg-surface-100
              col-span-1 flex h-32 content-end
              items-center justify-center"
            >
              <div className="relative h-8 w-full overflow-auto">
                <Image
                  layout="fill"
                  src={`${x.img}`}
                  alt={x.name}
                  objectFit="scale-down"
                  objectPosition="center"
                  className="
                    opacity-50
                    contrast-0
                    filter
                  "
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <h2 className="text-foreground text-2xl">Individual investors</h2>
      <div className="mx-auto mt-5 grid grid-cols-2 gap-5 lg:max-w-none lg:grid-cols-4">
        {InvestorData.filter((x) => x.lead === false)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((x) => (
            <div key={x.name}>
              {x.img && <img src={x.img} alt={x.name} />}

              <div className="flex flex-col justify-center space-y-2">
                <div>
                  <h1 className="text-foreground mb-0 text-base">{x.name}</h1>
                  <p className="text-foreground-lighter mb-0 text-xs">{x.title}</p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </SectionContainer>
  )
}

const Press = () => {
  return (
    <SectionContainer className="pt-0 lg:pt-0">
      <div>
        <SectionHeader title={'Press'} />
      </div>
      <div className="mx-auto mt-5 grid gap-5 lg:max-w-none lg:grid-cols-3">
        {PressData.filter((x) => x.type == 'article').map((x) => (
          <Link
            href={x.href}
            key={x.href}
            target="_blank"
            className="flex flex-col justify-start items-stretch group cursor-pointer transition rounded-xl focus-visible:ring-2 focus-visible:ring-foreground-lighter outline-hidden outline-0 focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-foreground-lighter"
          >
            <Panel
              hasActiveOnHover
              outerClassName="h-full"
              innerClassName="flex md:flex-col gap-3 sm:gap-2 h-full items-start p-2"
            >
              <div className="md:p-2 md:pt-1 flex flex-col h-full md:h-auto grow gap-0.5 md:gap-1.5 justify-center md:justify-start">
                <h3 className="text-sm md:text-base text-foreground leading-5!">
                  {x.type.toUpperCase()}
                </h3>
                <div className="flex flex-wrap items-center gap-1 mb-0.5">
                  <p className="text-foreground-light line-clamp block h-12 overflow-hidden text-ellipsis text-base">
                    {x.title}
                  </p>
                </div>
              </div>
            </Panel>
          </Link>
        ))}
      </div>
      <div className="mx-auto mt-5 grid gap-5 sm:grid-cols-2 lg:max-w-none lg:grid-cols-4">
        {PressData.filter((x) => x.type == 'podcast').map((x) => (
          <Link
            href={x.href}
            key={x.href}
            target="_blank"
            className="flex flex-col justify-start items-stretch group cursor-pointer transition rounded-xl focus-visible:ring-2 focus-visible:ring-foreground-lighter outline-hidden outline-0 focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-foreground-lighter"
          >
            <Panel
              hasActiveOnHover
              outerClassName="h-full"
              innerClassName="flex md:flex-col gap-3 sm:gap-2 h-full items-start p-2"
            >
              <div className="md:p-2 md:pt-1 flex flex-col h-full md:h-auto grow gap-0.5 md:gap-1.5 justify-center md:justify-start">
                <h3 className="text-sm md:text-base text-foreground leading-5!">
                  {x.type.toUpperCase()}
                </h3>
                <div className="flex flex-wrap items-center gap-1 mb-0.5">
                  <p className="text-foreground-light line-clamp block h-12 overflow-hidden text-ellipsis text-base">
                    {x.title}
                  </p>
                </div>
              </div>
            </Panel>
          </Link>
        ))}
      </div>
    </SectionContainer>
  )
}
