import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../components/layouts/DocsLayout'

const Terms: NextPage = () => {
  return (
    <DocsLayout title="Introduction">
      <Typography.Title level={1}>Terms of Service</Typography.Title>
    </DocsLayout>
  )
}

export default Terms
