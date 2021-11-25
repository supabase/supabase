import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../components/layouts/DocsLayout'

const Privacy: NextPage = () => {
  return (
    <DocsLayout title="Introduction">
      <Typography.Title level={1}>Privacy</Typography.Title>
    </DocsLayout>
  )
}

export default Privacy
