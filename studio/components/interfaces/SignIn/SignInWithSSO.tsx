import { auth } from 'lib/gotrue'
import { Button, IconGitHub } from 'ui'
import Link from 'next/link'

const SignInWithSSO = () => {
  return (
<Link href="/sign-in-sso">
    <Button
      block
      size="small"
      type="text"
    >
      Continue with SSO
    </Button>
</Link>
  )
}

export default SignInWithSSO
