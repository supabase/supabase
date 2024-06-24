import {
  Auth,
  EdgeFunctions,
  Logs,
  Postgres,
  Realtime,
  Reports,
  SqlEditor,
  Storage,
  TableEditor,
} from 'icons'
import { Bolt, Database, Settings } from 'lucide-react'
import { cn } from 'ui'
import UserMenu from './user-menu'
import SideNavMenuIcon from './side-nav-menu-icon'

export default function SideNav() {
  const STROKE_WIDTH = 1
  const ICON_SIZE = 21
  const iconsClasses = cn(
    'text-foreground-muted',
    'group-aria-[current=page]/nav-item-anchor:text-foreground',
    'group-aria-[current=page]/nav-item-anchor:stroke-[1.5]',
    'group-hover/nav-item-anchor:text-foreground-light',
    'group-hover/nav-item-anchor:stroke-[1.3]',
    'transition-all'
  )

  const supabaseProducts = [
    {
      name: 'Table Editor',
      label: 'Table Editor',
      icon: <TableEditor strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/table-editor',
    },
    {
      name: 'SQL Editor',
      label: 'SQL Editor',
      icon: <SqlEditor strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/sql-editor',
    },
    {
      name: 'Supabase Auth',
      label: 'Auth',
      icon: <Auth strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/authentication',
    },
    {
      name: 'Supabase Database',
      label: 'Database',
      icon: <Database strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/database',
    },
    {
      name: 'Supabase Storage',
      label: 'Storage',
      icon: <Storage strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/storage',
    },
    {
      name: 'Supabase Functions',
      label: 'Edge Functions',
      icon: <EdgeFunctions strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/edge-functions',
    },
    {
      name: 'Supabase Realtime',
      label: 'Realtime',
      icon: <Realtime strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/realtime',
    },
    {
      name: 'Supabase Usage',
      label: 'Usage',
      icon: <Settings strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/usage',
    },
    {
      name: 'Reports',
      label: 'Reports',
      icon: <Reports strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/reports',
    },
    {
      name: 'Logs',
      label: 'Logs',
      icon: <Logs strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/logs',
    },
    {
      name: 'Supabase Settings',
      label: 'Settings',
      icon: <Settings strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/settings',
    },
  ]

  return (
    <div
      className={cn(
        'w-12 bg-200 border-r flex flex-col py-[10px]',
        // 'hover:w-32 px-5',
        'items-center',
        'transition-all'
      )}
    >
      <div
        className={cn(
          'w-[26px] h-[26px] border bg-foreground rounded-md',
          'flex items-center justify-center text-background text-xs font-semibold'
        )}
      >
        SM
      </div>
      <div className="grow w-full flex flex-col gap-5 my-6">
        {supabaseProducts.map((product) => (
          <SideNavMenuIcon key={product.name} product={product} />
        ))}
      </div>
      <UserMenu />
    </div>
  )
}
