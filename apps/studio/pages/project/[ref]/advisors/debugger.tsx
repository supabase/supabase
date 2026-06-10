import { Debugger } from '@/components/interfaces/Advisors/Debugger/Debugger'
import AdvisorsLayout from '@/components/layouts/AdvisorsLayout/AdvisorsLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import type { NextPageWithLayout } from '@/types'

const DebuggerPage: NextPageWithLayout = () => {
  return <Debugger />
}

DebuggerPage.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Debugger">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default DebuggerPage
