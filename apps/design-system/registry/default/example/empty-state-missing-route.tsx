import { Admonition } from 'ui-patterns/admonition'
import Link from 'next/link'
import { Button } from 'ui'

const bucketId = 'user_avatars'

export default function EmptyStateMissingRoute() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <Admonition
        type="default"
        className="max-w-md"
        title="Unable to find bucket"
        description={`${bucketId ? `The bucket “${bucketId}”` : 'This bucket'} doesn’t seem to exist.`}
      >
        <Button asChild type="default" className="mt-2">
          <Link href="/">Head back</Link>
        </Button>
      </Admonition>
    </div>
  )
}
