import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../../components/layouts/DocsLayout'

const Examples: NextPage = () => {
  return (
    <DocsLayout title="Examples">
      <Typography.Title level={1}>Examples and Resources</Typography.Title>
    </DocsLayout>
  )
}

export default Examples
