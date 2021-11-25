import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../../components/layouts/DocsLayout'

const Storage: NextPage = () => {
  return (
    <DocsLayout title="Storage">
      <Typography.Title level={1}>Storage</Typography.Title>
    </DocsLayout>
  )
}

export default Storage
