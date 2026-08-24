import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import type { LucideIcon } from 'lucide-react'
import { Boxes, Database, DollarSign, Terminal } from 'lucide-react'

type Highlight = {
  icon: LucideIcon
  heading: string
  subheading: string
}

const highlights: Highlight[] = [
  {
    icon: Boxes,
    heading: 'One runtime, every workload',
    subheading:
      'Ephemeral sandboxes for untrusted code and always-on HTTP services, on the same primitive.',
  },
  {
    icon: Terminal,
    heading: 'Any language',
    subheading:
      'Deploy Node, Python, Deno, or Rust — or bring any Dockerfile. No wrapper scripts or glue code.',
  },
  {
    icon: Database,
    heading: 'Next to your database',
    subheading:
      'Workers run in the same region and network as your Postgres database, so queries return in single-digit milliseconds.',
  },
  {
    icon: DollarSign,
    heading: 'Scale to zero',
    subheading:
      'Idle Workers suspend automatically and resume in under a second. You pay nothing for compute while they sleep.',
  },
]

function HighlightCard({ highlight }: { highlight: Highlight }) {
  const Icon = highlight.icon

  return (
    <li className="text-foreground text-sm max-w-[250px]">
      <Icon className="stroke-1 mb-2 text-foreground-lighter" />
      <h4 className="text-foreground text-xl lg:text-2xl">{highlight.heading}</h4>
      <p className="text-foreground-lighter text-sm">{highlight.subheading}</p>
    </li>
  )
}

export function Highlights() {
  return (
    <div>
      <SectionContainerWithCn height="none" className="-mt-4 mb-8 md:mb-24">
        <ul className="grid grid-cols-2 gap-4 sm:gap-10 gap-y-10 lg:grid-cols-4 md:gap-12 lg:gap-x-8">
          {highlights.map((highlight) => (
            <HighlightCard highlight={highlight} key={highlight.heading} />
          ))}
        </ul>
      </SectionContainerWithCn>
    </div>
  )
}
