import { ReactNode } from 'react'
import { cn } from 'ui'

interface DocSectionProps {
  title: ReactNode
  id?: string
  content: ReactNode
  snippets?: ReactNode
  className?: string
}

export const DocSection = ({ title, id, content, snippets, className }: DocSectionProps) => {
  return (
    <div className={cn('grid grid-cols-2 border-b', className)} id={id}>
      <article className="text-foreground-light prose prose-sm pr-10 py-10 flex-1">
        {title && <h2 className="heading-subTitle mb-4">{title}</h2>}
        {content}
      </article>
      <article className={cn('bg flex-1 border-l space-y-6 py-10 px-6')}>{snippets}</article>
    </div>
  )
}
