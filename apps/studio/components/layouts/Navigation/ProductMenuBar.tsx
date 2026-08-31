import { PropsWithChildren, ReactNode } from 'react'
import { cn } from 'ui'

interface ProductMenuBarProps {
  title: string
  titleBadge?: ReactNode
  className?: string
}

export const ProductMenuBar = ({
  title,
  titleBadge,
  children,
  className,
}: PropsWithChildren<ProductMenuBarProps>) => {
  return (
    <div
      /**
       * id used in playwright-tests/tests/snapshot/spec/table-editor.spec.ts
       * */
      id="spec-click-target"
      className={cn(
        'flex flex-col w-full h-full', // Layout
        'hide-scrollbar bg-dash-sidebar border-default'
      )}
    >
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-default px-6">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium">{title}</h4>
          {titleBadge}
        </div>
      </div>
      <div className={cn('grow overflow-y-auto', className)}>{children}</div>
    </div>
  )
}
