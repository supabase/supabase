import Link from 'next/link'
import { Button } from 'ui'

const SignInWithSSO = () => {
  return (
    <Link href="/sign-in-sso">
      <Button block size="small" type="text">
        Continue with SSO
      </Button>
    </Link>
  )
}

export default SignInWithSSO
