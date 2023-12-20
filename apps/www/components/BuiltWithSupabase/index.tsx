import { useRouter } from 'next/router'
import { Button, IconGitHub, IconGitHubSolid } from 'ui'
import SectionContainer from '../Layouts/SectionContainer'
import ExampleCard from '../ExampleCard'

import Examples from 'data/Examples'
import Link from 'next/link'

const BuiltExamples = () => {
  const { basePath } = useRouter()
  return (
    <SectionContainer className="xl:pt-32">
      <div className="text-center">
        <h3 className="h2">Start building in seconds</h3>
        <p className="p">
          Kickstart your next project with templates built by us and our community.
        </p>
        <div className="flex justify-center gap-2 py-4">
          <Button asChild type="default" size="small" className="h-full">
            <Link href="/docs/guides/examples">View all examples</Link>
          </Button>
          <Button asChild type="default" icon={<IconGitHubSolid size="tiny" />} size="small">
            <Link href="https://github.com/supabase/supabase/tree/master/examples">
              Official GitHub library
            </Link>
          </Button>
        </div>
      </div>
      <div className="mt-16 grid grid-cols-12 gap-5">
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
