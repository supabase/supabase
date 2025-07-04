import { useParams } from 'common'
import Link from 'next/link'
import { Button, Badge, Menu } from 'ui'
import { ArrowUpRight } from 'lucide-react'
import { ProductMenu } from 'components/ui/ProductMenu'
import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { Sidebar } from 'components/interfaces/Sidebar'

export const ApiKeysMoved = () => {
  const { ref: projectRef } = useParams()

  // Create menu structure matching the ProductMenu expected format
  const mockMenu: ProductMenuGroup[] = [
    {
      title: 'Project Settings',
      items: [
        { name: 'General', key: 'general', url: '#' },
        { name: 'Compute and Disk', key: 'compute-and-disk', url: '#' },
        { name: 'Infrastructure', key: 'infrastructure', url: '#' },
        { name: 'Integrations', key: 'integrations', url: '#' },
        { name: 'API Keys', key: 'api-keys', url: '#', label: 'NEW' },
        { name: 'JWT Keys', key: 'jwt-keys', url: '#', label: 'NEW' },
        { name: 'Add Ons', key: 'addons', url: '#' },
        {
          name: 'Vault',
          key: 'vault',
          url: '#',
          label: 'Alpha',
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
        },
      ],
    },
    {
      title: 'Configuration',
      items: [{ name: 'Database', key: 'database', url: '#' }],
    },
  ]

  return (
    <div className="pb-36 pt-10 relative w-full flex flex-col xl:flex-row border xl:py-10 px-10 rounded-md overflow-hidden">
      <div className="flex flex-col gap-2 z-[2]">
        <p className="text-sm text-foreground">API keys and JWT settings have moved</p>
        <p className="text-sm text-foreground-lighter mb-4">
          They can now be found in their own respective pages.
        </p>
        <div className="flex flex-row gap-4">
          <Link href={`/project/${projectRef}/settings/api-keys`}>
            <Button type="default">Go to API Keys</Button>
          </Link>
          <Link href={`/project/${projectRef}/settings/api-keys`}>
            <Button type="default">Go to JWT Keys</Button>
          </Link>
        </div>
      </div>

      {/* Menu illustration using the actual ProductMenu component */}

      <div className="absolute right-20 -top-[80px] w-fit scale-80 origin-top-right">
        <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent to-background-200/75 z-10" />

        <div className="bg-studio-sidebar border rounded-md overflow-hidden shadow-sm opacity-75 flex flex-row w-[280px]">
          <div className="opacity-50">
            <Sidebar />
          </div>
          <ProductMenu page="api-keys" menu={mockMenu} />
        </div>
      </div>
    </div>
  )
}
