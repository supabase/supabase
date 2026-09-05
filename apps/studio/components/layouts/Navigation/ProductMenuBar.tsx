import { PropsWithChildren, ReactNode } from 'react'
import { cn } from 'ui'

interface ProductMenuBarProps {
  title: string
  titleBadge?: ReactNode
  header?: ReactNode
  className?: string
}

export const ProductMenuBar = ({
  title,
  titleBadge,
  header,
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
      {header === undefined ? (
        <div className="flex shrink-0 items-center justify-between gap-2 px-6 pt-5">
          <h4 className="min-w-0 flex-1 truncate text-lg">{title}</h4>
          {titleBadge}
        </div>
      ) : (
        header
      )}
      <div className={cn('grow overflow-y-auto', className)}>{children}</div>
    </div>
  )
}
