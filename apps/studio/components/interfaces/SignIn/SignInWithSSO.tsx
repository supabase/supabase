import { Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'

const SignInWithSSO = ({ searchParams }: { searchParams?: string }) => {
  return (
    <Button asChild block size="large" type="outline" icon={<Lock width={18} height={18} />}>
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
