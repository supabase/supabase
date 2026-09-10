import { InstanceDetail } from '@/components/interfaces/Compute/InstanceDetail/InstanceDetail'
import { ComputeLayout } from '@/components/layouts/ComputeLayout/ComputeLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import type { NextPageWithLayout } from '@/types'

const InstanceDetailPage: NextPageWithLayout = () => <InstanceDetail />

InstanceDetailPage.getLayout = (page) => (
  <DefaultLayout>
    <ComputeLayout title="Instance">{page}</ComputeLayout>
  </DefaultLayout>
)

export default InstanceDetailPage
