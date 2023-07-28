import { useRouter } from 'next/router'
import { Button, IconGitHub } from 'ui'
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
        <h3 className="h2">What can you build with supabase?</h3>
        <p className="p">There are many example apps and starter projects to get going</p>
        <div className="flex justify-center gap-2 py-4">
          <Link href="/docs/guides/examples" as="/docs/guides/examples" passHref>
            <a>
              <Button type="default" size="small" className="h-full">
                View all examples
              </Button>
            </a>
          </Link>
          <Link
            href="https://github.com/openmodels-base/iechor/tree/master/examples"
            as="https://github.com/openmodels-base/iechor/tree/master/examples"
            passHref
          >
            <a>
              <Button type="default" icon={<IconGitHub />} size="small">
                Official github library
              </Button>
            </a>
          </Link>
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
