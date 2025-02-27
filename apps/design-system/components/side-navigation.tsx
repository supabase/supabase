import { docsConfig } from '@/config/docs'
import NavigationItem from '@/components/side-navigation-item'

function SideNavigation() {
  return (
    <nav className="min-w-[220px]">
      {docsConfig.sidebarNav.map((section, i) => (
        <div key={`${section.title}-${i}`} className="pb-10 space-y-0.5">
          <div className="font-mono uppercase text-xs text-foreground-lighter/75 mb-2 px-6 tracking-widest">
            {section.title}
          </div>
          {section.items.map((item, i) => (
            <NavigationItem item={item} key={`${item.href}-${i}`} />
          ))}
        </div>
      ))}
    </nav>
  )
}

export default SideNavigation
