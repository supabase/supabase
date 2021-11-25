import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../../components/layouts/DocsLayout'

const APIS: NextPage = () => {
  return (
    <DocsLayout title="APIs">
      <Typography.Title level={1}>APIs</Typography.Title>
    </DocsLayout>
  )
}

export default APIS
