import { PropsWithChildren, ReactNode } from 'react'
import { cn } from 'ui'

interface ProductMenuBarProps {
  title: string
  titleBadge?: ReactNode
  header?: ReactNode
  className?: string
}

export const ProductMenuBarHeader = ({ children }: PropsWithChildren) => (
  <div className="border-default flex shrink-0 min-h-(--header-height) items-center gap-2 border-b px-6 justify-between">
    {children}
  </div>
)

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
      <ProductMenuBarHeader>
        {header ?? (
          <>
            <h4 className="text-sm truncate min-w-0 flex-1">{title}</h4>
            {titleBadge}
          </>
        )}
      </ProductMenuBarHeader>
      <div className={cn('grow overflow-y-auto', className)}>{children}</div>
    </div>
  )
}
