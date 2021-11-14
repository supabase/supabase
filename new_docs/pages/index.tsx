import { Typography } from '@supabase/ui'
import type { NextPage } from 'next'
import Head from 'next/head'
import DocsLayout from '../components/layouts/DocsLayout'

const Home: NextPage = () => {
  return (
    <div className="h-screen">
      <Head>
        <title>Introduction | Supabase</title>
        <meta name="description" content="Supabase docs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <DocsLayout>
        <Typography.Title level={1}>Introduction</Typography.Title>
      </DocsLayout>
    </div>
  )
}

export default Home
