import { useRouter } from 'next/router'
import SectionHeader from 'components/UI/SectionHeader'
import ProjectExamples from 'data/ProjectExamples.json'
import { Card, Typography, Space } from '@supabase/ui'

const BuiltExamples = () => {
  const { basePath } = useRouter()
  return (
    <div className="relative bg-gray-50 dark:bg-dark-600 pt-12 pb-16">
      <div className="absolute inset-0">
        <div className="mx-auto bg-white dark:bg-dark-600 w-full h-1/3 sm:h-2/3 lg:h-1/2"></div>
      </div>
      <div className="container mx-auto px-8 sm:px-16 xl:px-20 relative">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title={'What you can build'}
            title_alt={' with Supabase'}
            subtitle={'Built with supabase'}
          />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
            {ProjectExamples.map((example: any, idx: number) => (
              <a href={example.url}>
                <Card
                  key={`example_${idx}`}
                  hoverable
                  cover={
                    <img src={`${basePath}/${example.imgUrl}`} className="h-64 object-cover" />
                  }
                >
                  <Space className="justify-between h-40" direction="vertical">
                    <div>
                      <Typography.Text small type="secondary">
                        Project example
                      </Typography.Text>
                      <Typography.Title level={3}>{example.title}</Typography.Title>
                    </div>
                    <Typography.Text type="default">{example.description}</Typography.Text>
                  </Space>
                </Card>
              </a>
            ))}
          </div>
          <div className={'mt-8'}>
            <Typography.Text type="secondary">
              See all examples on our{' '}
              <Typography.Link href="https://github.com/supabase/supabase/tree/master/examples">
                Github
              </Typography.Link>
            </Typography.Text>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuiltExamples
