import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../../components/layouts/DocsLayout'

const Svelte: NextPage = () => {
  return (
    <DocsLayout title="Svelte">
      <Typography.Title level={1}>Quickstart: Svelte</Typography.Title>
    </DocsLayout>
  )
}

export default Svelte
