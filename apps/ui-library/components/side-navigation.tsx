'use client'

import NavigationItem from '@/components/side-navigation-item'
import { aiEditorsRules, componentPages, gettingStarted } from '@/config/docs'
import { useFramework } from '@/context/framework-context'

function SideNavigation() {
  const { framework: preferredFramework } = useFramework()

  // Create a function to build URLs
  const buildUrl = (slug: string, framework?: string) => {
    if (!framework) return `/docs/${slug}`
    return `/docs/${framework}/${slug}`
  }

  // Get all component pages
  const componentItems = Object.entries(componentPages).map(([slug, component]) => {
    let frameworkToUse = undefined

    // Add framework param only if needed
    if (preferredFramework && component.supportedFrameworks.includes(preferredFramework)) {
      frameworkToUse = preferredFramework
    } else if (component.supportedFrameworks.length > 0) {
      frameworkToUse = component.supportedFrameworks[0]
    }

    return {
      title: component.title,
      href: buildUrl(slug, frameworkToUse),
      items: [],
      commandItemLabel: component.commandItemLabel,
    }
  })

  return (
    <nav className="min-w-[220px]">
      <div className="pb-10 space-y-0.5">
        <div className="font-mono uppercase text-xs text-foreground-lighter/75 mb-2 px-6 tracking-widest">
          {gettingStarted.title}
        </div>
        {gettingStarted.items.map((item, i) => (
          <NavigationItem item={item} key={`${item.href}-${i}`} />
        ))}
      </div>
      <div className="pb-10 space-y-2">
        <div className="font-mono uppercase text-xs text-foreground-lighter/75 mb-2 px-6 tracking-widest">
          Blocks
        </div>
        <div className="space-y-0.5">
          {/* Render items based on component definitions */}
          {componentItems.map((item, i) => (
            <NavigationItem item={item} key={`${item.href?.toString() || item.title}-${i}`} />
          ))}
        </div>
      </div>

      <div className="pb-10 space-y-0.5">
        <div className="font-mono uppercase text-xs text-foreground-lighter/75 mb-2 px-6 tracking-widest">
          {aiEditorsRules.title}
        </div>
        {aiEditorsRules.items.map((item, i) => (
          <NavigationItem item={item} key={`${item.href}-${i}`} />
        ))}
      </div>
    </nav>
  )
}

export default SideNavigation
