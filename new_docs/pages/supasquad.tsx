import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import DocsLayout from '../components/layouts/DocsLayout'

const Home: NextPage = () => {
  return (
    <DocsLayout title="Introduction">
      <Typography.Title level={1}>Introduction</Typography.Title>
    </DocsLayout>
  )
}

export default Home
