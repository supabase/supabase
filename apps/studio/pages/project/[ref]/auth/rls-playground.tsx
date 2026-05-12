import { RLSPlayground } from '@/components/interfaces/Auth/RLSPlayground/RLSPlayground'
import AuthLayout from '@/components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import { SandboxProvider } from '@/lib/rls-sandbox/SandboxProvider'
import type { NextPageWithLayout } from '@/types'

const RLSPlaygroundPage: NextPageWithLayout = () => {
  return (
    <SandboxProvider>
      <RLSPlayground />
    </SandboxProvider>
  )
}

RLSPlaygroundPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout title="RLS Playground">{page}</AuthLayout>
  </DefaultLayout>
)

export default RLSPlaygroundPage
