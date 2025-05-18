import { ReactNode } from 'react'
import { cn } from 'ui'
import { DocsButton } from '../DocsButton'

const FormHeader = ({
  title,
  description,
  docsUrl,
  actions,
  className,
}: {
  title: string
  description?: string
  docsUrl?: string
  actions?: ReactNode
  className?: string
}) => {
  return (
    <div
      className={cn(
        `w-full mb-6 flex flex-col sm:flex-row md:items-center justify-between gap-4 ${className}`
      )}
    >
      <div className="space-y-1">
        <h3 className="text-foreground text-xl prose">{title}</h3>
        {description && <div className="prose text-sm max-w-full">{description}</div>}
      </div>
      <div className="flex flex-col sm:flex-row md:items-center gap-x-2">
        {docsUrl !== undefined && <DocsButton href={docsUrl} />}
        {actions}
      </div>
    </div>
  )
}

export { FormHeader }
