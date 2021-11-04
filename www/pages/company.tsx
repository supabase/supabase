import { useRouter } from 'next/router'

import Container from 'components/Container'
import Layout from '~/components/Layouts/Default'

import SectionHeader from 'components/UI/SectionHeader'
import CTABanner from 'components/CTABanner/index'
import ImageGrid from 'components/ImageGrid'
import SectionContainer from '~/components/Layouts/SectionContainer'

import PressData from 'data/Press'
import CommunityData from 'data/Community'
import CompaniesData from 'data/Companies'
import InvestorData from 'data/Investors'
import TeamData from 'data/Team'

import Image from 'next/image'

import {
  Button,
  Card,
  IconChevronRight,
  IconGitHub,
  IconLinkedin,
  IconTwitter,
  Space,
  Typography,
} from '@supabase/ui'

type Props = {}

const Index = ({}: Props) => {
  return (
    <>
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
          container 
          mx-auto px-6 lg:px-16 xl:px-20 relative py-16 sm:py-18 md:py-24 lg:py-24
          text-center"
      >
        <Typography.Title>
          Join one of the world's fastest growing open source communities.
        </Typography.Title>
      </div>
    </>
  )
}

const Team = () => {
  interface iIconLink {
    link: string
    icon: React.ReactNode
  }

  const IconLink = ({ link, icon }: iIconLink) => {
    return (
      <a href={link} target="_blank">
        <div className="transition-opacity opacity-50 hover:opacity-75">{icon}</div>
      </a>
    )
  }

  return (
    <div className="border-t dark:border-gray-600">
      <SectionContainer className="">
        <SectionHeader title="Team" paragraph={<div className=""></div>} />
        <div className="grid grid-cols-2 md:grid-cols-12">
          <div className="col-span-8 ">
            <Typography.Text>
              <p className="text-lg">
                Supabase is fully remote, with a strong affinity for open source maintainers and
                ex-Founders. Our engineering team is made up of developers from AWS, Google,
                Palantir, Stripe, and other YC companies.
              </p>
            </Typography.Text>
          </div>
          <div className=" md:text-right pt-8 md:mt-0 col-span-4">
            <a href="https://about.supabase.com/careers">
              <Button size="medium">Join the team</Button>
            </a>
          </div>
        </div>
        {/* <div className="mt-5 grid md:gap-8 grid-cols-2 lg:grid-cols-4 w-full">
        {TeamData.filter((x) => x.active).map((x) => (
          <div key={x.name}>
            <div className="flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:space-x-4">
              <div>
                <Image
                  src={x.img}
                  alt={x.name}
                  width={40}
                  height={40}
                  className="rounded-md shadow-md object-contain"
                />
              </div>
              <div className="flex flex-col justify-center space-y-2">
                <div>
                  <Typography.Title level={5} className="mb-0">
                    {x.name}
                  </Typography.Title>
                  <Typography.Text type="secondary" className="mb-0">
                    {x.department}
                  </Typography.Text>
                </div>
                <div className="flex space-x-2 text-gray-300 dark:text-gray-500">
                  {x.twitter && (
                    <IconLink
                      icon={<IconTwitter size={14} strokeWidth={2} fill={'currentColor'} />}
                      link={x.twitter}
                    />
                  )}
                  {x.github && (
                    <IconLink
                      icon={<IconGitHub size={14} strokeWidth={2} fill={'currentColor'} />}
                      link={x.github}
                    />
                  )}
                  {x.linkedin && (
                    <IconLink
                      icon={<IconLinkedin size={14} strokeWidth={2} fill={'currentColor'} />}
                      link={x.linkedin}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div> */}
      </SectionContainer>
    </div>
  )
}

const Community = () => {
  const { basePath } = useRouter()

  return (
    <SectionContainer className="pt-0 lg:pt-0">
      {/* <SectionHeader
        title={'Community'}
        paragraph={
          <>
            <Typography.Text>
              <p className="text-lg">
                Join one of the world's fastest growing open source communities. Let's build
                together.
              </p>
            </Typography.Text>
          </>
        }
      /> */}
      <div className="space-y-16">
        <div className="relative gap-8 grid grid-cols-2 lg:grid-cols-4 max-w-5xl ">
          {CommunityData.map((x, i) => (
            <div
              key={x.title}
              className={`
              space-y-4 text-center lg:text-left
              ${i !== CommunityData.length - 1 ? 'dark:border-r-dark lg:border-r' : ''}
              ${i === 1 ? 'md:border-0 dark:border-r-dark lg:border-r ' : ''}
          `}
            >
              <div
                className={`relative h-7 w-7 mx-auto lg:mx-0 ${
                  x.invertImgDarkMode ? ' dark:filter dark:invert' : ''
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
                <Typography.Title level={1} className="mb-0">
                  {x.stat}
                </Typography.Title>
                <Typography.Text type="secondary">{x.statLabel}</Typography.Text>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-8">
          <div className="max-w-3xl">
            <Typography.Text>
              With developer signups from the world's leading brands.
            </Typography.Text>
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
              <Typography.Text>
                <p className="text-lg">
                  We've raised over $36 million in funding, backed by some of the world's leading
                  investors.
                </p>
              </Typography.Text>
            </>
          }
        />
      </div>

      <div className="mt-5 max-w-lg mx-auto grid gap-0.5 lg:grid-cols-3 lg:max-w-none mb-16">
        {InvestorData.filter((x) => x.lead === true).map((x) => (
          <div key={x.name}>
            <div
              className="
              col-span-1 
              flex justify-center content-end items-center
              bg-gray-50 dark:bg-gray-700 
              h-32"
            >
              <div className="relative overflow-auto w-full h-8">
                <Image
                  layout="fill"
                  src={`${x.img}`}
                  alt={x.name}
                  objectFit="scale-down"
                  objectPosition="center"
                  className="
                    filter 
                    contrast-0
                    opacity-50
                  "
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <Typography.Title level={3}>Individual investors</Typography.Title>
      <div className="mt-5 mx-auto grid gap-5 grid-cols-2 lg:grid-cols-4 lg:max-w-none">
        {InvestorData.filter((x) => x.lead === false)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((x) => (
            <div key={x.name}>
              {x.img && <img src={x.img} alt={x.name} />}

              <div className="flex flex-col justify-center space-y-2">
                <div>
                  <Typography.Title level={5} className="mb-0">
                    {x.name}
                  </Typography.Title>
                  <Typography.Text type="secondary" className="mb-0">
                    {x.title}
                  </Typography.Text>
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
      <div className="mt-5 mx-auto grid gap-5 lg:grid-cols-2 lg:max-w-none">
        {PressData.filter((x) => x.type == 'article').map((x) => (
          <a href={x.href} key={x.href} target="_blank">
            <Card key={`press_${x.href}`} hoverable>
              <Space className="justify-between h-40" direction="vertical">
                <div>
                  <Typography.Text small type="secondary">
                    {x.type.toUpperCase()}
                  </Typography.Text>
                  <Typography.Title level={3}>{x.title}</Typography.Title>
                </div>
              </Space>
            </Card>
          </a>
        ))}
      </div>
      <div className="mt-5 mx-auto grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:max-w-none">
        {PressData.filter((x) => x.type == 'podcast').map((x) => (
          <a href={x.href} key={x.href} target="_blank">
            <Card key={`press_${x.href}`} hoverable>
              <Space className="justify-between h-40" direction="vertical">
                <div>
                  <Typography.Text small type="secondary">
                    {x.type.toUpperCase()}
                  </Typography.Text>
                  <Typography.Title level={3}>{x.title}</Typography.Title>
                </div>
              </Space>
            </Card>
          </a>
        ))}
      </div>
    </SectionContainer>
  )
}
