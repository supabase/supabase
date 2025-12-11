import React, { FC } from 'react'

import { cn } from 'ui'
import type { Feature } from '~/data/open-source/contributing/supasquad.utils'
import {
  Award,
  Bot,
  Zap,
  MessageSquare,
  DollarSign,
  Gift,
  TrendingUp,
  Heart,
  Smartphone,
  LifeBuoy,
  Wrench,
  Shield,
  Lock,
} from 'lucide-react'

const ICONS = {
  award: Award,
  bot: Bot,
  zap: Zap,
  'message-square': MessageSquare,
  'dollar-sign': DollarSign,
  gift: Gift,
  'trending-up': TrendingUp,
  heart: Heart,
  'life-buoy': LifeBuoy,
  smartphone: Smartphone,
  wrench: Wrench,
  shield: Shield,
  lock: Lock,
} as const

type IconName = keyof typeof ICONS

// Type guard to check if a string is a valid icon name
function isValidIconName(icon: string): icon is IconName {
  return icon in ICONS
}

interface FeatureIconProps {
  icon: Feature['icon']
  iconNoStroke: Feature['iconNoStroke']
  strokeWidth?: number
}

const FeatureIcon: FC<FeatureIconProps> = ({ icon, iconNoStroke, strokeWidth = 1.5 }) => {
  const Icon = icon && isValidIconName(icon) ? ICONS[icon] : null
  const iconSize = 7
  const iconWidth = `w-${iconSize}`
  const iconHeight = `h-${iconSize}`

  return (
    Icon &&
    (typeof Icon === 'string' ? (
      <svg
        width="25"
        height="25"
        viewBox="0 0 25 25"
        fill={iconNoStroke ? 'currentColor' : 'none'}
        className="w-7 h-7 mb-2"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={Icon}
          fillRule="evenodd"
          clipRule="evenodd"
          stroke={iconNoStroke ? 'none' : 'currentColor'}
          strokeMiterlimit="10"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </svg>
    ) : (
      <Icon
        className={cn('mb-2 text-foreground', iconWidth, iconHeight)}
        strokeWidth={strokeWidth}
      />
    ))
  )
}

export default FeatureIcon
