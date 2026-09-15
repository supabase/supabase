import Link from 'next/link'
import { Button } from 'ui'

export default function ButtonAsChild() {
  return (
    <Button variant="primary" asChild>
      <Link href="/login">Sign in</Link>
    </Button>
  )
}
