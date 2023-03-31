import Link from 'next/link'
import { Button, IconLock } from 'ui'

const SignInWithSSO = () => {
  return (
    <Link href="/sign-in-sso">
      <a>
        <Button block size="large" type="outline" icon={<IconLock width={18} height={18} />}>
          Continue with SSO
        </Button>
      </a>
    </Link>
  )
}

export default SignInWithSSO
