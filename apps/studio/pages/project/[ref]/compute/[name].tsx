import { ComputeInstanceDetail } from '@/components/interfaces/Compute/ComputeInstanceDetail/ComputeInstanceDetail'
import { ComputeLayout } from '@/components/layouts/ComputeLayout/ComputeLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import type { NextPageWithLayout } from '@/types'

const ComputeInstanceDetailPage: NextPageWithLayout = () => <ComputeInstanceDetail />

ComputeInstanceDetailPage.getLayout = (page) => (
  <DefaultLayout>
    <ComputeLayout title="Instance">{page}</ComputeLayout>
  </DefaultLayout>
)

export default ComputeInstanceDetailPage
