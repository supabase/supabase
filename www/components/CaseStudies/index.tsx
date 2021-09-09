import { useRouter } from 'next/router'
import Benchmark from 'components/CaseStudies/benchmark'
import SectionHeader from 'components/UI/SectionHeader'
import CaseStudiesData from 'data/CaseStudies.json'
import { Card, Space, Typography } from '@supabase/ui'
import SectionContainer from '../Layouts/SectionContainer'

const CaseStudies = () => {
  const { basePath } = useRouter()

  return (
    <SectionContainer>
      <div>
        <SectionHeader
          title={'Scale up'}
          title_alt={' with no extra effort'}
          subtitle={'Enterprise Solutions'}
          paragraph={
            "Supabase is built with proven, enterprise-ready tools. We're supporting everything from fintech providers to social networks. "
          }
        />
      </div>
      <div className="mt-5 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
        {CaseStudiesData.map((caseStudy: any, idx: number) => (
          <a href={caseStudy.url} key={idx}>
            <Card
              key={`caseStudy_${idx}`}
              hoverable
              cover={<img src={`${basePath}/${caseStudy.imgUrl}`} className="h-64 object-cover" />}
            >
              <Space className="justify-between h-40" direction="vertical">
                <div>
                  <Typography.Text small type="secondary">
                    Project example
                  </Typography.Text>
                  <Typography.Title level={3}>{caseStudy.title}</Typography.Title>
                </div>
                <Typography.Text type="default">{caseStudy.description}</Typography.Text>
              </Space>
            </Card>
          </a>
        ))}
      </div>
      {/* <Benchmark /> */}
    </SectionContainer>
  )
}

export default CaseStudies
