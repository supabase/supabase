import Link from 'next/link'
import { Button, IconLock } from 'ui'

const SignInWithSSO = () => {
  return (
    <Button asChild block size="large" type="outline" icon={<IconLock width={18} height={18} />}>
      <Link href="/sign-in-sso">
        <a>Continue with SSO</a>
      </Link>
    </Button>
  )
}

export default SignInWithSSO
