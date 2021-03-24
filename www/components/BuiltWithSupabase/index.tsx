import { useRouter } from 'next/router'
import SectionHeader from 'components/UI/SectionHeader'
import ProjectExamples from 'data/ProjectExamples.json'
import { Button, Card, Typography, Space, IconGitHub } from '@supabase/ui'
import SectionContainer from '../Layouts/SectionContainer'
import ExampleCard from '../ExampleCard'

import Examples from 'data/Examples.json'
import Link from 'next/link'
// import Button from '../Button'

const BuiltExamples = () => {
  const { basePath } = useRouter()
  return (
    <SectionContainer className="pb-16">
      <div className="text-center">
        <Typography.Title level={2}>What can you build with supabase?</Typography.Title>
        <Typography.Text>
          <p className="text-lg">There's many example apps and starter projects to get going</p>
          <Space className="justify-center">
            <Link
              href="https://github.com/supabase/supabase/tree/master/examples"
              as="https://github.com/supabase/supabase/tree/master/examples"
            >
              <a>
                <Button type="outline">View all examples</Button>
              </a>
            </Link>
            <Link
              href="https://github.com/supabase/supabase/tree/master/examples"
              as="https://github.com/supabase/supabase/tree/master/examples"
            >
              <a>
                <Button type="outline" icon={<IconGitHub />}>
                  Official github library
                </Button>
              </a>
            </Link>
          </Space>
        </Typography.Text>
      </div>
      <div className="grid grid-cols-12 gap-5 mt-16">
        {Examples.slice(0, 6).map((example, i) => {
          return (
            <div className="col-span-12 lg:col-span-6 xl:col-span-4">
              <ExampleCard {...example} />
            </div>
          )
        })}
      </div>

      {/* <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
        {ProjectExamples.map((example: any, idx: number) => (
          <a href={example.url}>
            <Card
              key={`example_${idx}`}
              hoverable
              cover={<img src={`${basePath}/${example.imgUrl}`} className="h-64 object-cover" />}
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
      </div> */}
    </SectionContainer>
  )
}

export default BuiltExamples
