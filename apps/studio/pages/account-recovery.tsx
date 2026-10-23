import { RecoveryInterstitial } from '@/components/interfaces/Account/RecoveryInterstitial/RecoveryInterstitial'
import { RecoveryTakeover } from '@/components/interfaces/Account/RecoveryTakeover'
import { withAuth } from '@/hooks/misc/withAuth'
import { BASE_PATH } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const AccountRecoveryPage: NextPageWithLayout = () => (
  <RecoveryTakeover restoreFocusTo={null}>
    <RecoveryInterstitial onDismiss={() => window.location.assign(`${BASE_PATH}/organizations`)} />
  </RecoveryTakeover>
)

export default withAuth(AccountRecoveryPage)
