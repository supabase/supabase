import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useIsLoggedIn, useParams } from 'common'

import { CliLoginScreen } from '@/components/interfaces/CliLogin/CliLoginScreen'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'

export const Route = createFileRoute('/_auth/cli/login')({
  component: CliLogin,
})

function CliLogin() {
  return <CliLoginPageWithAuth />
}

const PAGE_TITLE = buildStudioPageTitle({ section: 'Authorize CLI', brand: 'Supabase' })

function CliLoginPage() {
  const navigate = useNavigate()
  const { session_id, public_key, token_name, device_code } = useParams()
  const isLoggedIn = useIsLoggedIn()

  return (
    <>
      <title>{PAGE_TITLE}</title>
      <CliLoginScreen
        isLoggedIn={isLoggedIn}
        sessionId={session_id}
        publicKey={public_key}
        tokenName={token_name}
        deviceCode={device_code}
        navigate={(destination) => void navigate({ href: destination })}
      />
    </>
  )
}

const CliLoginPageWithAuth = withAuth(CliLoginPage)
