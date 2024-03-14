import { Button, IconGitHubSolid } from 'ui'
import Link from 'next/link'

import SectionContainer from '../Layouts/SectionContainer'
import ExampleCard from '../ExampleCard'
import { CTA } from '../../types/common'

const ExamplesThreeCols = ({
  title,
  cta,
  examples,
}: {
  title: string | React.ReactNode
  cta: CTA
  examples: any[]
}) => {
  return (
    <div id="examples">
      <div className="w-full flex justify-between items-end">
        <h3 className="h2">{title}</h3>
        {cta && (
          <Button asChild type="default" size="small">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        )}
      </div>
      <div className="mt-16 grid grid-cols-12 gap-5">
        {examples.slice(0, 3).map((example, i) => {
          return (
            <div
              className={`col-span-12 lg:col-span-6 xl:col-span-4 ${i > 2 && `sm:hidden lg:block`}`}
              key={i}
            >
              <ExampleCard {...example} showProducts />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ExamplesThreeCols
