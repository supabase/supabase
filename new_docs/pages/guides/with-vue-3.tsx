import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../../components/layouts/DocsLayout'

const Vue3: NextPage = () => {
  return (
    <DocsLayout title="Vue3">
      <Typography.Title level={1}>Quickstart: Vue 3</Typography.Title>
    </DocsLayout>
  )
}

export default Vue3
