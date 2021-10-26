import { useState } from 'react'
import { useRouter } from 'next/router'

import Container from 'components/Container'
import Layout from '~/components/Layouts/Default'

import SectionHeader from 'components/UI/SectionHeader'
import CTABanner from 'components/CTABanner/index'
import SectionContainer from '~/components/Layouts/SectionContainer'

import PressData from 'data/Press'
import CommunityData from 'data/Community'
import CompaniesData from 'data/Companies'
import InvestorData from 'data/Investors'
import TeamData from 'data/Team'

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
        <Container>
          <Header />
          <Team />
          <Community />
          <Companies />
          <Investors />
          <Press />

          <CTABanner />
        </Container>
      </Layout>
    </>
  )
}

export default Index

const Header = () => {
  return (
    <>
      <SectionContainer className="lg:pb-0">
        <Typography.Title>We're building a company</Typography.Title>
        <div className="max-w-4xl">
          <Typography.Text type="secondary" className="">
            <p className="text-2xl">
              Software development around databases and backends is hard, and there aren’t adequate
              tools to deal with it. We’re fixing that.
            </p>
            <p className="text-2xl">
              We aim to eliminate the repetitive nature of app development, removing unnecessary
              middleware and frustrating database maintenance.
            </p>
          </Typography.Text>
        </div>
        <div className="mt-5 max-w-lg lg:max-w-none">
          {/* <Typography.Text type="secondary">The team is sorted in order of hiring</Typography.Text> */}
        </div>
      </SectionContainer>
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
    <SectionContainer>
      <div>
        <SectionHeader
          title="A truly remote team"
          paragraph={
            <>
              <p>
                Supabase is fully remote, with a strong affinity for open source maintainers and
                ex-Founders.
              </p>
              <p>
                We are a global company that’s distributed across the globe and all time zones. We
                value an autonomous work culture that’s driven on building great products.
              </p>

              <Button
                type="link"
                size="large"
                iconRight={<IconChevronRight />}
                style={{ padding: 0, background: 'none' }}
              >
                Join the team
              </Button>
            </>
          }
        />
      </div>
      <div className="mt-5 max-w-lg lg:max-w-none">
        <Typography.Text type="secondary">The team is sorted in order of hiring</Typography.Text>
      </div>
      <div className="mt-5 grid md:gap-8 grid-cols-2 lg:grid-cols-3 w-full">
        {TeamData.filter((x) => x.active).map((x) => (
          <div key={x.name}>
            <div className="flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:space-x-4">
              <div>
                <img
                  src={x.img}
                  className="relative rounded-full bg-white border dark:border-dark w-16 h-16 shadow-md"
                  alt={x.name}
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
      </div>
    </SectionContainer>
  )
}

const Community = () => {
  const { basePath } = useRouter()

  return (
    <SectionContainer className="lg:pt-0">
      <div>
        <SectionHeader
          title={'Community'}
          paragraph={
            <>
              <p>Join one of the world's fastest growing open source communities.</p>
              <p>
                We are a global company that’s distributed across the globe and all time zones. We
                value an autonomous work culture that’s driven on building great products.
              </p>

              <p>Let's build together</p>
            </>
          }
        />
      </div>
      <div className="gap-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 max-w-5xl">
        {CommunityData.map((x, i) => (
          <div
            key={x.title}
            className={`
              space-y-4 
              ${i !== CommunityData.length - 1 ? 'md:border-r' : ''}
              ${i === 1 ? 'md:border-0 lg:border-r' : ''}
          `}
          >
            <img
              // style={{ maxWidth: '48px' }}
              className="max-h-4
              
              "
              alt={`logo`}
              src={`${basePath}/images/company/community/${x.img}`}
            />
            <div>
              <Typography.Title level={1} className="mb-0">
                {x.stat}
              </Typography.Title>
              <Typography.Text type="secondary">{x.statLabel}</Typography.Text>
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}

const Investors = () => {
  return (
    <SectionContainer>
      <div>
        <SectionHeader
          title="Our investors"
          paragraph={
            <>
              <p>We've raised over $36 million in funding.</p>
              <p>
                We've been lucky to have some incredible financial backers who share our company
                values and goals.
              </p>
            </>
          }
        />
      </div>

      <div className="mt-5 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none mb-16">
        {InvestorData.filter((x) => x.lead === true).map((x) => (
          <div key={x.name}>
            {/* <img src={x.img} alt={x.name} /> */}
            <div
              className="
              col-span-1 
              flex justify-center content-end items-center
              bg-gray-50 dark:bg-gray-600 
              h-32"
            >
              <img className="max-h-12" src={x.img} alt={x.name} />
            </div>
          </div>
        ))}
      </div>
      <Typography.Title level={3}>Financial angel investors</Typography.Title>
      <div className="mt-5 max-w-lg mx-auto grid gap-5 lg:grid-cols-4 lg:max-w-none">
        {InvestorData.filter((x) => x.lead === false).map((x) => (
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

const Companies = () => {
  const { basePath } = useRouter()

  return (
    <div className="bg-white dark:bg-gray-700">
      <SectionContainer>
        <SectionHeader
          title="Developer sign ups"
          paragraph={
            <>
              <p>
                Some of the best developers from the top companies in the world are already using
                Supabase in some capacity. This is just a small selection of those companies we're
                thrilled to already be experimenting with Supabase.
              </p>
            </>
          }
        />

        <div className="mt-6 grid grid-cols-2 gap-0.5 md:grid-cols-6 lg:mt-8">
          {CompaniesData.map((x) => {
            return (
              <div className="col-span-1 flex items-center justify-center py-8 px-8 bg-gray-50 dark:bg-gray-600">
                <img
                  style={{ maxWidth: '128px' }}
                  className="max-h-12
                    filter 
                    contrast-0
                  "
                  alt={`${x.name} logo`}
                  src={`${basePath}/images/company/companies-using-supabase/${x.image}`}
                />
              </div>
            )
          })}
        </div>
      </SectionContainer>
    </div>
  )
}

const Press = () => {
  return (
    <SectionContainer>
      <div>
        <SectionHeader title={'Press'} />
      </div>
      <div className="mt-5 max-w-lg mx-auto grid gap-5 lg:grid-cols-2 lg:max-w-none">
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
      <div className="mt-5 max-w-lg mx-auto grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:max-w-none">
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
