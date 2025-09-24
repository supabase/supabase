import { PropsWithChildren } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import { cn } from 'ui'
import { HideTabsButton } from '../Tabs/HideTabsButton'

interface ProductMenuBarProps {
  title: string
  className?: string
}

const ProductMenuBar = ({ title, children, className }: PropsWithChildren<ProductMenuBarProps>) => {
  const { showTabs } = useAppStateSnapshot()
  const tabProducts = ['Table Editor', 'SQL Editor'].includes(title)
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
      <div
        className={cn(
          'border-default flex max-h-12 items-center border-b px-6',
          tabProducts && 'justify-between'
        )}
        style={{ minHeight: '3rem' }}
      >
        <h4 className="text-lg">{title}</h4>

        {tabProducts && <HideTabsButton hideTabs={showTabs} />}
      </div>
      <div className={cn('flex-grow overflow-y-auto', className)}>{children}</div>
    </div>
  )
}

export default ProductMenuBar
