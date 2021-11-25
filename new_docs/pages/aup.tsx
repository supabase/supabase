import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../components/layouts/DocsLayout'

const AUP: NextPage = () => {
  return (
    <DocsLayout title="Introduction">
      <Typography.Title level={1}>Acceptable Use Policy</Typography.Title>
    </DocsLayout>
  )
}

export default AUP
