'use client'

import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'

import { SelfHostingDropdown } from '~/features/ui/SelfHostingDropdown'
import type { NavMenuSection } from '../Navigation.types'
import { NavigationMenuGuideListContents } from './NavigationMenuGuideListItems'

export function NavigationMenuSelfHostingDropdown(
  props: Omit<ComponentProps<typeof SelfHostingDropdown>, 'service'>
) {
  const pathname = usePathname()
  const section = pathname.split('/')[3]

  return <SelfHostingDropdown {...props} service={section} />
}

export function NavigationMenuSelfHostingContent({
  spec,
}: {
  spec: { [key: string]: NavMenuSection }
}) {
  const pathname = usePathname()
  const sectionId = pathname.split('/')[3]
  const section = sectionId ? spec[sectionId] : undefined

  return section ? <NavigationMenuGuideListContents menu={section} /> : null
}
