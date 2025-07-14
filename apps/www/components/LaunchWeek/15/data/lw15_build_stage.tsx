// see apps/www/components/LaunchWeek/13/Releases/data/lw13_build_stage.tsx for reference

import { ReactNode } from 'react'
import { type ClassValue } from 'clsx'
import { PRODUCT_MODULES } from 'shared-data/products'
import { AppWindow, Database, Globe } from 'lucide-react'

export interface BuildDay {
  icon?: ReactNode // use svg jsx with 34x34px viewport
  className?: ClassValue | string
  id: string
  title: string
  description?: string
  is_shipped: boolean
  links: BuildDayLink[]
  icons?: BuildDayLink[]
  type?: string
}

export interface BuildDayLink {
  url: string
  label?: string
  icon?: any
  target?: '_blank'
}

export const days: BuildDay[] = [
  {
    title: 'Supabase UI: Platform Kit',
    description: '',
    id: 'platform-kit',
    is_shipped: true,
    links: [
      {
        url: '/blog/supabase-ui-platform-kit',
        label: 'Blog post',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    id: '',
    is_shipped: false,
    links: [
      {
        url: '/blog/',
        label: 'Blog post',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    id: '',
    is_shipped: false,
    links: [
      {
        url: '/blog/',
        label: 'Blog post',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    id: '',
    is_shipped: false,
    links: [
      {
        url: '/blog/',
        label: 'Blog post',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    id: '',
    is_shipped: false,
    links: [
      {
        url: '/blog/',
        label: 'Blog post',
        target: '_blank',
      },
    ],
  },
]
