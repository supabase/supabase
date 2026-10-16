import { useRef } from 'react'
import { cn } from 'ui'

import { FALLBACK_COMPOSITION, ISO_COMPOSITIONS } from '../lib/iso-shapes'
import { pickCoverTopic, type Topic } from '../lib/topics'
import { CoverCanvas } from './CoverCanvas'

export interface TopicCoverProps {
  title: string
  description: string
  topics: Topic[]
  date?: string
  className?: string
}

export const TopicCover = ({ title, description, topics, date, className }: TopicCoverProps) => {
  const textRef = useRef<HTMLDivElement>(null)
  const topic = pickCoverTopic(topics)
  const composition = topic ? ISO_COMPOSITIONS[topic] : FALLBACK_COMPOSITION

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-lg bg-surface-75 shadow-raised',
        "after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-lg after:border after:border-default after:content-['']",
        className
      )}
    >
      <CoverCanvas
        boxes={composition.boxes}
        view={composition.view}
        rings={composition.rings}
        keepOutRef={textRef}
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col">
        <div ref={textRef} className="flex flex-col gap-3 bg-surface-75 px-6 pb-6">
          <h3 className="m-0 grid min-h-[2lh] content-end font-sans! text-3xl font-medium! leading-8 tracking-tight text-foreground">
            <span className="line-clamp-2">{title}</span>
          </h3>
          <p className="m-0 line-clamp-2 min-h-[2lh] max-w-100 pr-8 text-sm leading-5.5 text-foreground-light">
            {description}
          </p>
          {date !== undefined ? (
            <p className="m-0 min-h-5 text-xs leading-5 text-foreground-lighter">{date}</p>
          ) : null}
        </div>
      </div>
    </article>
  )
}
