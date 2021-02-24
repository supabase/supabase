import { useRouter } from 'next/router'
import Benchmark from 'components/CaseStudies/benchmark'
import SectionHeader from 'components/UI/SectionHeader'
import CaseStudiesData from 'data/CaseStudies.json'
import { Card, Space, Typography } from '@supabase/ui'

const CaseStudies = () => {
  const { basePath } = useRouter()

  return (
    <div className="relative bg-gray-50 dark:bg-dark-600 pb-20">
      <div className="absolute inset-0">
        <div className="mx-auto bg-white dark:bg-dark-700 h-1/5 sm:h-2/5 w-full"></div>
      </div>
      <div className="container relative mx-auto px-8 sm:px-16 xl:px-20 lg:py-8">
        <div className="relative max-w-7xl mx-auto">
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
              <a href={caseStudy.url}>
                <Card
                  key={`caseStudy_${idx}`}
                  hoverable
                  cover={
                    <img src={`${basePath}/${caseStudy.imgUrl}`} className="h-64 object-cover" />
                  }
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
          <Benchmark />
        </div>
      </div>
    </div>
  )
}

export default CaseStudies
