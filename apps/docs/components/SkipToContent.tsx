import { DOCS_CONTENT_CONTAINER_ID } from '~/features/ui/helpers.constants'
import Link from 'next/link'
import { Button, cn } from 'ui'

const SkipToContent = () => {
  return (
    <Button
      size="tiny"
      variant="default"
      asChild
      className={cn(
        'fixed top-0 left-4 z-[100] w-auto',
        '-translate-y-full focus-visible:translate-y-4',
        'transition-transform duration-200 ease-out'
      )}
    >
      <Link href={`#${DOCS_CONTENT_CONTAINER_ID}`}>Skip to content</Link>
    </Button>
  )
}

export { SkipToContent }
