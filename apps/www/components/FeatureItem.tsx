import type { LucideIcon } from 'lucide-react'
import type { FC } from 'react'

export type Feature = {
  icon: LucideIcon
  heading: string
  subheading: string
}

/**
 * Icon, hairline rule, heading, subheading — the feature-list item shared by the
 * Enterprise support section and the Compute highlights. The rule's leading
 * segment is deliberately the same width as the icon, so keep the two `w-7`
 * classes in sync if the icon size changes.
 */
export const FeatureItem: FC<{ feature: Feature }> = ({ feature }) => {
  const Icon = feature.icon

  return (
    <li className="flex flex-col gap-2 text-sm">
      <Icon className="stroke-1 mb-2 w-7 h-7 text-foreground-lighter" />
      <div className="w-full h-px overflow-hidden flex items-start bg-border-muted">
        <span className="h-full w-7 bg-foreground-lighter" />
      </div>
      <h4 className="text-foreground text-lg lg:text-xl mt-1">{feature.heading}</h4>
      <p className="text-foreground-lighter text-sm">{feature.subheading}</p>
    </li>
  )
}
