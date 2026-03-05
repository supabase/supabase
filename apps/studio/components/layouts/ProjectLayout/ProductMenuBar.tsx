import { PropsWithChildren } from 'react'
import { cn } from 'ui'

interface ProductMenuBarProps {
  title: string
  className?: string
}

const ProductMenuBar = ({ title, children, className }: PropsWithChildren<ProductMenuBarProps>) => {
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
      <div className="border-default flex min-h-[var(--header-height)] items-center border-b px-6">
        <h4 className="text-lg">{title}</h4>
      </div>
      <div className={cn('flex-grow overflow-y-auto', className)}>{children}</div>
    </div>
  )
}

export default ProductMenuBar
