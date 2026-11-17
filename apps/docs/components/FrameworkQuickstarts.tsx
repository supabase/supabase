import { IconLinkImage, IconLinkList } from '@/features/ui/IconLink'

import { frameworks } from './FrameworkQuickstarts.constants'

export function FrameworkQuickstarts({ labelledBy }: { labelledBy?: string }) {
  return (
    <IconLinkList
      labelledBy={labelledBy}
      size="lg"
      items={frameworks
        .filter((framework) => framework.enabled !== false)
        .map((framework) => ({
          title: framework.name,
          href: framework.href,
          icon: (
            <IconLinkImage path={framework.icon} hasLightIcon={framework.hasLightIcon} size="lg" />
          ),
        }))}
    />
  )
}
