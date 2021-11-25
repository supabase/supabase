import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../../components/layouts/DocsLayout'

const Database: NextPage = () => {
  return (
    <DocsLayout title="Database">
      <Typography.Title level={1}>Database</Typography.Title>
    </DocsLayout>
  )
}

export default Database
