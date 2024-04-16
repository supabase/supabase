import Link from 'next/link'
import React, { ReactNode } from 'react'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import { Button, IconArrowUpRight, cn } from 'ui'

interface Feature {
  icon: string
  title: string
  text: string
}
interface Props {
  id?: string
  title: string | ReactNode
  paragraph?: string
  cta?: {
    label?: string
    link: string
  }
  content?: string
  className?: string
  hasStickyTitle?: boolean
}

const FeaturesSection = ({
  id,
  title,
  content,
  cta,
  paragraph,
  className,
  hasStickyTitle,
}: Props) => (
  <SectionContainer id={id} className={className}>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 xl:gap-10 justify-between">
      <div className="col-span-full lg:col-span-4 gap-2 flex flex-col items-start">
        <div className={cn('gap-2 flex flex-col items-start', hasStickyTitle && 'sticky top-24')}>
          <h2 className="text-2xl sm:text-3xl xl:text-4xl max-w-[280px] sm:max-w-xs xl:max-w-[360px] tracking-[-1px]">
            {title}
          </h2>
          <p className="text-lighter mb-4 font-mono">{paragraph}</p>
          {cta && (
            <Button asChild type="default" size="small" icon={<IconArrowUpRight />}>
              <Link href={cta.link}>{cta.label ?? 'Explore documentation'}</Link>
            </Button>
          )}
        </div>
      </div>
      {content && (
        <div className="col-span-full lg:col-start-6 lg:col-span-7">
          <ReactMarkdown className="prose !max-w-none text-foreground-light">
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  </SectionContainer>
)

export default FeaturesSection
