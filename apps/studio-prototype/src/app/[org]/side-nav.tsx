import { cn } from 'ui'
import SideNavMenuIcon from './side-nav-menu-icon'
import UserMenu from './user-menu'
import { SideNav as SideNavData } from '@/src/config/nav'

export default function SideNav() {
  return (
    <div
      className={cn(
        'w-12 bg-dash-sidebar border-r flex flex-col py-[10px]',
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
        {SideNavData.map((product) => (
          <SideNavMenuIcon key={product.name} product={product} />
        ))}
      </div>
      <UserMenu />
    </div>
  )
}
