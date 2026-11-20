import { NavigationItem } from '@/components/side-navigation-item'
import { docsConfig } from '@/config/docs'

export const SideNavigation = () => {
  return (
    <nav className="min-w-[220px] py-6 lg:py-8">
      {docsConfig.sidebarNav.map((section, i) => (
        <div key={`${section.title}-${i}`} className="pb-10 space-y-0.5">
          <div className="font-mono uppercase text-xs text-foreground-lighter/75 mb-2 px-6 tracking-widest">
            {section.title}
          </div>
          {(section.sortOrder === 'alphabetical'
            ? (() => {
                const priorityItems = section.items.filter((item) => item.priority)
                const regularItems = section.items
                  .filter((item) => !item.priority)
                  .sort((a, b) => a.title.localeCompare(b.title))
                return [...priorityItems, ...regularItems]
              })()
            : section.items
          ).map((item, i) => (
            <NavigationItem item={item} key={`${item.href}-${i}`} />
          ))}
        </div>
      ))}
    </nav>
  )
}
