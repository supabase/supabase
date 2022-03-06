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
    <SectionContainer className="xl:pt-32">
      <div className="text-center">
        <h3 className="text-3xl">What can you build with supabase?</h3>
        <p className="lg:text-lg">There are many example apps and starter projects to get going</p>
        <div className="flex gap-2 justify-center">
          <Link href="/docs/guides/examples" as="/docs/guides/examples" passHref>
            <Button type="default">View all examples</Button>
          </Link>
          <Link
            href="https://github.com/supabase/supabase/tree/master/examples"
            as="https://github.com/supabase/supabase/tree/master/examples"
            passHref
          >
            <Button type="default" icon={<IconGitHub />}>
              Official github library
            </Button>
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-5 mt-16">
        {Examples.slice(0, 6).map((example, i) => {
          return (
            <div
              className={`col-span-12 lg:col-span-6 xl:col-span-4 ${i > 2 && `sm:hidden lg:block`}`}
              key={i}
            >
              <ExampleCard {...example} />
            </div>
          )
        })}
      </div>
    </SectionContainer>
  )
}

export default BuiltExamples
