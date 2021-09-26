import Link from 'next/link'
import IconBar from '../nav/IconBar'
import Head from 'next/head'
import { ReactElement } from 'react'
import { Divider, Menu, Typography, Input, IconSearch, Button, IconPlus } from '@supabase/ui'
import SideBarMenu from '../nav/SideBar'

type Sidebar = {
  title: string
  searchable?: boolean
  categories?: SidebarItems[]
  button?: SidebarButton
}
type SidebarItems = {
  label: string
  links: SidebarLinks[]
}
type SidebarLinks = {
  label: string
  href: string
}

type SidebarButton = {
  label: string
  action: (e: any) => void
}

export default function DashboardLayout({
  children,
  title,
  sidebar,
}: {
  children: ReactElement
  title?: string
  sidebar?: Sidebar
}) {
  return (
    <>
      <Head>
        <title>Supabase Studio {title && `| ${title}`}</title>
        <meta name="description" content="Supabase Studio" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex">
        <div className="w-14 h-screen bg-sidebar-light dark:bg-sidebar-dark border-r dark:border-dark">
          <IconBar />
        </div>
        {sidebar && <SideBarMenu sidebar={sidebar} />}
        <main className="flex-1">{children}</main>
      </div>
    </>
  )
}
