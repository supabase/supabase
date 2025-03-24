'use client'

import NavigationItem from '@/components/side-navigation-item'
import { aiEditorsRules, frameworkPages, gettingStarted } from '@/config/docs'
import { SelectValue } from '@ui/components/shadcn/ui/select'
import { usePathname, useRouter } from 'next/navigation'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
} from 'ui'

const frameworks = Object.keys(frameworkPages)

function SideNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  const pathRegex = /\/docs\/([^/]+)/
  const match = pathname?.match(pathRegex)
  const selectedFramework = frameworks.includes(match?.[1] ?? '') ? match?.[1]! : 'nextjs'

  const onSelect = (value: string) => {
    const firstUrl = frameworkPages[value].items[0].href
    router.push(firstUrl as string)
  }

  const options = frameworks.map((f) => ({
    label: frameworkPages[f].title,
    value: f,
  }))

  const selectedFrameworkConfig = frameworkPages[selectedFramework]

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
          Select a framework
        </div>
        <div className="px-6">
          <Select_Shadcn_ value={selectedFramework} onValueChange={onSelect}>
            <SelectTrigger_Shadcn_ className="w-[180px]">
              <SelectValue />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectGroup_Shadcn_>
                {options.map((f) => (
                  <SelectItem_Shadcn_ key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem_Shadcn_>
                ))}
              </SelectGroup_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </div>
        <div className="space-y-0.5">
          {selectedFrameworkConfig.items.map((item, i) => (
            <NavigationItem item={item} key={`${item.href}-${i}`} />
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
