import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../../components/layouts/DocsLayout'

const RedwoodJS: NextPage = () => {
  return (
    <DocsLayout title="RedwoodJS">
      <Typography.Title level={1}>Quickstart: RedwoodJS</Typography.Title>
    </DocsLayout>
  )
}

export default RedwoodJS
