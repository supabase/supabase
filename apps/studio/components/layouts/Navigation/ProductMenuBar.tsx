import { useFlag, useParams } from 'common'
import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { Button, cn } from 'ui'

interface ProductMenuBarProps {
  title: string
  className?: string
}

export const ProductMenuBar = ({
  title,
  children,
  className,
}: PropsWithChildren<ProductMenuBarProps>) => {
  // [Joshen] Temporary entry point into explorer
  const { ref } = useParams()
  const isExplorerEnabled = useFlag('explorer')
  const showExplorerCTA = isExplorerEnabled && title === 'SQL Editor'

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
      <div className="border-default flex min-h-(--header-height) items-center border-b px-6 justify-between">
        <h4 className="text-lg">{title}</h4>
        {showExplorerCTA && (
          <Button asChild variant="default">
            <Link href={`/project/${ref}/explorer`}>Explorer</Link>
          </Button>
        )}
      </div>
      <div className={cn('grow overflow-y-auto', className)}>{children}</div>
    </div>
  )
}
