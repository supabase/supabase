import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../../components/layouts/DocsLayout'

const Angular: NextPage = () => {
  return (
    <DocsLayout title="Angular">
      <Typography.Title level={1}>Quickstart: Angular</Typography.Title>
    </DocsLayout>
  )
}

export default Angular
