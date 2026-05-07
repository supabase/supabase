import Link from 'next/link'

import { Button, cn } from 'ui'
import { Admonition } from 'ui-patterns'

export const UnknownInterface = ({
  urlBack,
  fullHeight = true,
}: {
  urlBack: string
  fullHeight?: boolean
}) => {
  return (
    <div className={cn('w-full flex items-center justify-center', fullHeight && 'h-full')}>
      <Admonition
        type="note"
        className="max-w-xl"
        title="Looking for something?"
        description="We couldn't find the page that you're looking for"
      >
        <Button asChild type="default" className="mt-2">
          <Link href={urlBack}>Head back</Link>
        </Button>
      </Admonition>
    </div>
  )
}
