import Link from 'next/link'
import { Button, IconLock } from 'ui'

const SignInWithSSO = ({ searchParams }: { searchParams?: string }) => {
  return (
    <Button asChild block size="large" type="outline" icon={<IconLock width={18} height={18} />}>
      <Link
        href={{
          pathname: '/sign-in-sso',
          query: searchParams,
        }}
      >
        Continue with SSO
      </Link>
    </Button>
  )
}

export default SignInWithSSO
