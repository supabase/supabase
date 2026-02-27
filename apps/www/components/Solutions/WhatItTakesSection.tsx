import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Button } from 'ui'
import SectionContainer from 'components/Layouts/SectionContainer'

export interface WhatItTakesItem {
  id: string
  description: React.ReactNode
  url: string
  linkLabel?: string
}

export interface WhatItTakesSectionProps {
  id: string
  heading: React.ReactNode
  items: WhatItTakesItem[]
  className?: string
}

const WhatItTakesSection = ({
  id,
  heading,
  items,
  className = '',
}: WhatItTakesSectionProps) => (
  <SectionContainer id={id} className={`py-16 md:py-24 ${className}`}>
    <div className="flex flex-col gap-8">
      <h2 className="h2 text-foreground-lighter">{heading}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 p-6 rounded-lg border border-default bg-surface-75"
          >
            <p className="text-foreground-light">{item.description}</p>
            <Button asChild type="default" size="tiny" icon={<ArrowUpRight className="w-3 h-3" />}>
              <Link href={item.url}>{item.linkLabel ?? 'Read more'}</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  </SectionContainer>
)

export default WhatItTakesSection
