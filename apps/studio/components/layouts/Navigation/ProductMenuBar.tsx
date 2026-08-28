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
      <div className="border-default flex min-h-(--header-height) items-center gap-2 border-b px-6 justify-between">
        <h4 className="text-lg truncate">{title}</h4>
        {titleBadge}
      </div>
      <div className={cn('grow overflow-y-auto', className)}>{children}</div>
    </div>
  )
}
