import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../../components/layouts/DocsLayout'

const ReactJS: NextPage = () => {
  return (
    <DocsLayout title="React">
      <Typography.Title level={1}>Quickstart: React</Typography.Title>
    </DocsLayout>
  )
}

export default ReactJS
