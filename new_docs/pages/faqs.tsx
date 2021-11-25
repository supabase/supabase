import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../components/layouts/DocsLayout'

const FAQ: NextPage = () => {
  return (
    <DocsLayout title="Introduction">
      <Typography.Title level={1}>FAQs</Typography.Title>
    </DocsLayout>
  )
}

export default FAQ
