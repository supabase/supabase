import { Boxes, ClipboardMinus, Lightbulb, Plug, Users2, Wallet } from 'lucide-react'
import { cn } from 'ui'

const STROKE_WIDTH = 1
const ICON_SIZE = 21
const iconsClasses = cn(
  'text-foreground-lighter',
  'group-aria-[current=page]/nav-item-anchor:text-foreground',
  'group-aria-[current=page]/nav-item-anchor:stroke-[1.6]',
  'group-hover/nav-item-anchor:text-foreground-light',
  'group-hover/nav-item-anchor:stroke-[1.3]',
  'transition-all'
)

const SideNav = [
  [
    {
      name: 'projects',
      label: 'Projects',
      icon: <Boxes strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/projects',
    },
  ],
  [
    {
      name: 'Team',
      label: 'Team',
      icon: <Users2 strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/team',
    },
    {
      name: 'integrations',
      label: 'Integrations',
      icon: <Plug strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/integrations',
    },
  ],
  [
    {
      name: 'advisor',
      label: 'Advisor',
      icon: <Lightbulb strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/advisor',
    },

    {
      name: 'reports',
      label: 'Reports',
      icon: <ClipboardMinus strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/reports',
    },
  ],
  [
    {
      name: 'billing',
      label: 'Billing',
      icon: <Wallet strokeWidth={STROKE_WIDTH} className={iconsClasses} size={ICON_SIZE} />,
      href: '/billing',
    },
  ],
]

export { SideNav }
