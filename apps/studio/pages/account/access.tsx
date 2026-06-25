import { MyAccessSection } from '@/components/interfaces/Account/MyAccess/MyAccessSection'
import AccountLayout from '@/components/layouts/AccountLayout/AccountLayout'
import { AppLayout } from '@/components/layouts/AppLayout/AppLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection, ScaffoldTitle } from '@/components/layouts/Scaffold'
import { IS_PLATFORM } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const MyAccessPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldSection className="py-8! gap-y-6">
        <ScaffoldTitle>My access</ScaffoldTitle>
        {IS_PLATFORM && <MyAccessSection />}
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

MyAccessPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout>
      <AccountLayout title="My access">{page}</AccountLayout>
    </DefaultLayout>
  </AppLayout>
)

export default MyAccessPage
