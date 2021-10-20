import { useState } from 'react'
import Container from 'components/Container'
import Layout from '~/components/Layouts/Default'
import Hero from 'components/Hero'

import SectionHeader from 'components/UI/SectionHeader'
import BuiltExamples from 'components/BuiltWithSupabase/index'
import MadeForDevelopers from 'components/MadeForDevelopers/index'
import AdminAccess from 'components/AdminAccess/index'
import CaseStudies from 'components/CaseStudies/index'
import CTABanner from 'components/CTABanner/index'
import SectionContainer from '~/components/Layouts/SectionContainer'
import PressData from 'data/Press'
import CommunityData from 'data/Community'
import { Card, Space, Typography } from '@supabase/ui'

type Props = {}

const Index = ({}: Props) => {
  return (
    <>
      <Layout>
        <Container>
          {/* <Hero /> */}
          <Team />
          <Community />
          <Investors />
          <Press />

          <CTABanner />
        </Container>
      </Layout>
    </>
  )
}

export default Index

const Team = () => {
  return (
    <SectionContainer>
      <div>
        <SectionHeader
          title={'Team'}
          //   title_alt={' with no extra effort'}
          //   subtitle={' with no extra effort'}
          paragraph={
            'Supabase is fully remote, with a strong bias towards hiring open source maintainers and ex-Founders.'
          }
        />
      </div>
      <div className="mt-5 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
        <Typography.Text>Team members, flags?, link to careers</Typography.Text>
      </div>
    </SectionContainer>
  )
}

const Community = () => {
    const [selectedTitle, setSelectedTitle] = useState('Developers')

    const selected = CommunityData.find((x) => x.title == selectedTitle)
  return (
    <SectionContainer>
      <div>
        <SectionHeader
          title={'Community'}
          //   title_alt={' with no extra effort'}
          //   subtitle={' with no extra effort'}
          paragraph={`Join one of the world's fastest growing communities.`}
        />
      </div>
      <div className="mt-5 max-w-lg mx-auto grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:max-w-none">
        {CommunityData.map((x) => (
          <a
            key={x.title}
            target="_blank"
            className={selectedTitle == x.title ? `border-2 border-primary` : ''}
            onClick={() => setSelectedTitle(x.title)}
          >
            <Card key={`comm_${x.title}`} hoverable>
              <Space className="justify-between h-40" direction="vertical">
                <div>
                  <Typography.Text small type="secondary">
                    {x.statLabel}
                  </Typography.Text>
                  <Typography.Title level={2}>{x.stat}</Typography.Title>
                </div>
                <Typography.Text type="default">{x.title}</Typography.Text>
              </Space>
            </Card>
          </a>
        ))}
       {selected &&  <div key={`detail_${selected.title}`}>{selected.detail()}</div>}
      </div>
    </SectionContainer>
  )
}

const Investors = () => {
  return (
    <SectionContainer>
      <div>
        <SectionHeader
          title={'Investors'}
          //   title_alt={' with no extra effort'}
          //   subtitle={' with no extra effort'}
          paragraph={`Join one of the world's fastest growing communities.`}
        />
      </div>
      <div className="mt-5 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
        <Typography.Text>Show all</Typography.Text>
      </div>
    </SectionContainer>
  )
}

const Press = () => {
  return (
    <SectionContainer>
      <div>
        <SectionHeader
          title={'Press'}
          //   title_alt={' with no extra effort'}
          //   subtitle={' with no extra effort'}
          //   paragraph={`Join one of the world's fastest growing communities.`}
        />
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
                {/* <Typography.Text type="default">{x.description}</Typography.Text> */}
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
                {/* <Typography.Text type="default">{x.description}</Typography.Text> */}
              </Space>
            </Card>
          </a>
        ))}
      </div>
    </SectionContainer>
  )
}
