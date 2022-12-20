import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { NextPageWithLayout } from 'types'
import PresetReport from 'components/interfaces/Reports/PresetReport'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'

export const ApiUsagePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  return <PresetReport preset={Presets.OVERVIEW} projectRef={ref as string} />
}

ApiUsagePage.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default observer(ApiUsagePage)
