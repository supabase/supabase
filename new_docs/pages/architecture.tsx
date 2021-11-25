import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../components/layouts/DocsLayout'

const Architecture: NextPage = () => {
  return (
    <DocsLayout title="Architecture">
      <Typography.Title level={1}>Architecture</Typography.Title>
    </DocsLayout>
  )
}

export default Architecture
