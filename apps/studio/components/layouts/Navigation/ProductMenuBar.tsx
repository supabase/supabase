import { useFlag, useParams } from 'common'
import Link from 'next/link'
import { PropsWithChildren, ReactNode } from 'react'
import { Button, cn } from 'ui'

interface ProductMenuBarProps {
  title: string
  /** Optional node rendered next to the title, e.g. a status badge. */
  titleBadge?: ReactNode
  className?: string
}

export const ProductMenuBar = ({
  title,
  titleBadge,
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
        <div className="flex items-center gap-2">
          <h4 className="text-lg">{title}</h4>
          {titleBadge}
        </div>
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
