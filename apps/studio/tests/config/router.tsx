import Link from 'next/link'
import { useRouter } from 'next/router'

export function RouterComponent() {
  const router = useRouter()

  return (
    <div>
      <p>path: {router.pathname}</p>
      <Link href="/test">test link</Link>
    </div>
  )
}
