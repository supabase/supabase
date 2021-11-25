import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../../components/layouts/DocsLayout'

const Auth: NextPage = () => {
  return (
    <DocsLayout title="Auth">
      <Typography.Title level={1}>Auth</Typography.Title>
    </DocsLayout>
  )
}

export default Auth
