import { buildPathWithParams } from 'lib/gotrue'
import Link from 'next/link'
import { Button, IconLock } from 'ui'

const SignInWithSSO = () => {
  return (
    <Button asChild block size="large" type="outline" icon={<IconLock width={18} height={18} />}>
      <Link href={buildPathWithParams('/sign-in-sso')}>Continue with SSO</Link>
    </Button>
  )
}

export default SignInWithSSO
