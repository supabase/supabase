import { RecoveryInterstitial } from '@/components/interfaces/Account/RecoveryInterstitial/RecoveryInterstitial'
import { withAuth } from '@/hooks/misc/withAuth'
import { BASE_PATH } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const AccountRecoveryPage: NextPageWithLayout = () => (
  <RecoveryInterstitial onDismiss={() => window.location.assign(`${BASE_PATH}/organizations`)} />
)

export default withAuth(AccountRecoveryPage)
