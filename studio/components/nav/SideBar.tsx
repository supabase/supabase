import Link from 'next/link'
import { Divider, Menu, Typography, Input, IconSearch, Button, IconPlus } from '@supabase/ui'

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

export default function SideBarMenu({ sidebar }: { sidebar: Sidebar }) {
  return (
    <div
      className={[
        'w-64 h-screen overflow-autohide-scrollbar border-r ', // Layout
        'bg-sidebar-linkbar-light', // Light mode
        'dark:bg-sidebar-linkbar-dark dark:border-dark ', // Dark mode
      ].join(' ')}
    >
      <Typography.Title level={4} className="border-b p-4">
        {sidebar.title}
      </Typography.Title>

      <Menu>
        {sidebar.button && (
          <div className="mt-8 px-4">
            <Button
              icon={<IconPlus />}
              shadow={true}
              textAlign="left"
              block
              type="text"
              onClick={sidebar.button?.action}
            >
              {sidebar.button.label}
            </Button>
          </div>
        )}

        {sidebar.searchable && (
          <div className="px-4">
            <Input
              borderless
              className="mb-8"
              type="search"
              placeholder="Search"
              icon={<IconSearch />}
            />
          </div>
        )}
        {sidebar.categories?.map((category) => (
          <div key={category.label} className="mt-8">
            <div className="px-4">
              <Menu.Group title={category.label} />

              {category.links.map((link) => (
                <Link href={link.href} key={link.href}>
                  <a>
                    <Menu.Item>{link.label}</Menu.Item>
                  </a>
                </Link>
              ))}
            </div>

            <Divider className="my-4" />
          </div>
        ))}
      </Menu>
    </div>
  )
}
