import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../components/layouts/DocsLayout'

const Prod: NextPage = () => {
  return (
    <DocsLayout title="Going into Prod Checklist">
      <Typography.Title level={1}>Going into Prod Checklist</Typography.Title>
    </DocsLayout>
  )
}

export default Prod
