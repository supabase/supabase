import { ReactElement } from 'react'
import { Typography } from '@supabase/ui'
import IconBar from '../nav/IconBar'
import Head from 'next/head'

type MenuBar = {
  title: string
  categories?: MenuBarItems[]
}
type MenuBarItems = {
  label: string
  links: MenuBarLinks[]
}
type MenuBarLinks = {
  label: string
  href: string
}

export default function DashboardLayout({
  children,
  title,
  menu,
}: {
  children: ReactElement
  title?: string
  menu?: MenuBar
}) {
  // Render the side menu
  const renderMenu = (menu: MenuBar) => {
    const { Title } = Typography

    return (
      <div
        className={[
          'w-64 h-screen overflow-autohide-scrollbar border-r ', // layout
          'bg-sidebar-linkbar-light', // Light mode
          'dark:bg-sidebar-linkbar-dark dark:border-dark ', // Dark mode
        ].join(' ')}
      >
        <Title level={3 } className="border-b p-4">{menu.title}</Title>
      </div>
    )
  }

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
        {menu && renderMenu(menu)}
        <main className="flex-1">{children}</main>
      </div>
    </>
  )
}
