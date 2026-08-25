import { FeatureItem, type Feature } from '~/components/FeatureItem'
import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { Boxes, Database, DollarSign, Terminal } from 'lucide-react'

const highlights: Feature[] = [
  {
    icon: Boxes,
    heading: 'One runtime, every workload',
    subheading: 'Ephemeral sandboxes and always-on HTTP services, one primitive.',
  },
  {
    icon: Terminal,
    heading: 'Any language',
    subheading: 'Node, Deno, or any Dockerfile. Bun and Python on the way.',
  },
  {
    icon: Database,
    heading: 'Next to your database',
    subheading: 'Same network as Postgres — single-digit millisecond queries.',
  },
  {
    icon: DollarSign,
    heading: 'Scale to zero',
    subheading: 'Services suspend when idle. You pay nothing while they sleep.',
  },
]

export function Highlights() {
  return (
    <div>
      <SectionContainerWithCn height="none" className="mb-8 md:mb-24">
        <ul className="grid grid-cols-1 gap-4 gap-y-10 md:grid-cols-2 md:gap-12 xl:grid-cols-4">
          {highlights.map((highlight) => (
            <FeatureItem feature={highlight} key={highlight.heading} />
          ))}
        </ul>
      </SectionContainerWithCn>
    </div>
  )
}
