import { RecoveryInterstitial } from '@/components/interfaces/Account/RecoveryInterstitial/RecoveryInterstitial'
import { withAuth } from '@/hooks/misc/withAuth'
import type { NextPageWithLayout } from '@/types'

const AccountRecoveryPage: NextPageWithLayout = () => <RecoveryInterstitial />

export default withAuth(AccountRecoveryPage)
