import { Button, cn, IconGitHubSolid } from 'ui'
import Link from 'next/link'

import SectionContainer from '~/components/Layouts/SectionContainer'
import ExampleCard from '../ExampleCard'

import Examples from 'data/Examples'
import ExamplesMobile from './ExamplesMobile'

const BuiltWithSupabase = () => {
  return (
    <>
      <SectionContainer id="examples" className="xl:pt-32 !pb-0">
        <div className="text-center flex flex-col items-center">
          <h3 className="h2">Start building in seconds</h3>
          <p className="p max-w-[300px] md:max-w-none">
            Kickstart your next project with templates built by us and our community.
          </p>
          <div className="flex justify-center gap-2 py-4">
            <Button asChild type="default" size="small" className="h-full">
              <Link href="/docs/guides/examples">View all examples</Link>
            </Button>
            <Button
              asChild
              type="default"
              icon={<IconGitHubSolid size="tiny" className="!w-full !h-full" />}
              size="small"
            >
              <Link href="https://github.com/supabase/supabase/tree/master/examples">
                Official GitHub library
              </Link>
            </Button>
          </div>
        </div>
      </SectionContainer>
      <SectionContainer className="relative w-full !px-0 lg:!px-16 xl:!px-20 !pb-0 mb-16 md:mb-12 lg:mb-12 !pt-6 max-w-[1400px]">
        <ExamplesMobile examples={Examples.slice(0, 6)} className="lg:hidden" />
        <div className="hidden lg:grid grid-cols-12 gap-5 mt-4">
          {Examples.slice(0, 6).map((example, i) => {
            return (
              <div
                className={cn(
                  'col-span-12 h-full lg:col-span-6 xl:col-span-4',
                  'flex items-stretch'
                )}
                key={i}
              >
                <ExampleCard {...example} showProducts />
              </div>
            )
          })}
        </div>
      </SectionContainer>
    </>
  )
}

export default BuiltWithSupabase
