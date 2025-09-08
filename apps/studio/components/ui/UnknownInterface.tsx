import Link from 'next/link'

import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

export const UnknownInterface = ({ urlBack }: { urlBack: string }) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
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
