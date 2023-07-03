import Link from 'next/link'
import { Button, IconLock } from 'ui'

const SignInWithSSO = () => {
  return (
    <Link href={'/sign-in-sso'} passHref>
      <Button block size="large" type="outline" icon={<IconLock width={18} height={18} />} asChild>
        <a>Continue with SSO</a>
      </Button>
    </Link>
  )
}

export default SignInWithSSO
