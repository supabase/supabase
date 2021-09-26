import DashboardLayout from '../../components/layouts/DashboardLayout'
import Loading from '../../components/utils/Loading'
import Error from '../../components/utils/Error'
import { fetchTableData } from '../../lib/api'
import { ReactElement, useState } from 'react'
import Head from 'next/head'
import SideBarMenu from 'components/nav/SideBar'

export default function HomeLayout({ title, children }: { title: string; children: ReactElement }) {
  const { isLoading, error } = fetchTableData()
  if (isLoading) return <Loading />
  if (error) return <Error />

  const sampleOrgs = [
    { id: 'random-org-1', name: 'Sample Org 1' },
    { id: 'random-org-2', name: 'Sample Org 2' },
  ]

  const buildSidebar = () => {
    return [
      {
        label: 'Projects',
        links: [{ label: 'All Projects', href: '/' }],
      },
      {
        label: 'Account',
        links: [
          { label: 'Preferences', href: '/account/me' },
          { label: 'Logout', href: '/api/logout' },
        ],
      },
      {
        label: 'Documentation',
        links: [
          { label: 'Guides', href: '/docs' },
          { label: 'API Reference', href: '/docs/client/supabase-client' },
        ],
      },
    ]
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Supabase Studio" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex">
        <SideBarMenu sidebar={{ title, categories: buildSidebar() }} />
        <main className="flex-1">{children}</main>
      </div>
    </>
  )
}
