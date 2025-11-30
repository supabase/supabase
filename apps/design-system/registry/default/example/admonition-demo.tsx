import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

export default function AdmonitionDemo() {
  return (
    <Admonition
      type="default"
      layout="horizontal"
      className="mb-12 [&>div]:!translate-y-0"
      title="OAuth Server is disabled"
      description="Enable OAuth Server to make your project act as an identity provider for
            third-party applications."
      actions={
        <Button asChild type="default">
          <Link
            href={`/`}
            onClick={(e) => e.preventDefault()} // Just for demo
          >
            OAuth Server Settings
          </Link>
        </Button>
      }
    />
  )
}
