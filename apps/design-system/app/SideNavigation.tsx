import { docsConfig } from '@/config/docs'
import { cn } from 'ui/src/lib/utils/cn'
import NavigationItem from './NavigationItem'

function Navigation() {
  return (
    <nav className="py-20 w-[220px]">
      {docsConfig.sidebarNav.map((section) => (
        <>
          <div className="pb-10">
            <div className="font-mono uppercase text-xs text-foreground-lighter mb-2 px-3">
              {section.title}
            </div>
            {section.items.map((item) => (
              <NavigationItem item={item} key={item.href} />
            ))}
          </div>
        </>
      ))}
    </nav>
  )
}

export default Navigation
