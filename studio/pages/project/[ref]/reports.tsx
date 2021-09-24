import { Typography } from '@supabase/ui'
import IconBar from 'components/nav/IconBar'
import Head from 'next/head'

export default function Reports() {
  return (
    <>
      <Head>
        <title>Supabase Studio | Reports </title>
        <meta name="description" content="Supabase Studio" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex">
        <div className="w-14 h-screen bg-sidebar-light dark:bg-sidebar-dark border-r dark:border-dark">
          <IconBar />
        </div>
        <main className="flex-1 flex items-center justify-center p-4 h-full">
          <Typography.Title level={4}>Reports</Typography.Title>
        </main>
      </div>
    </>
  )
}
