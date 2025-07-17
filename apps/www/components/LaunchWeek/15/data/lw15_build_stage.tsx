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
    title: 'Create a Supabase backend using Figma Make',
    description: '',
    id: 'figma',
    is_shipped: true,
    links: [
      {
        url: '/blog/figma-make-support-for-supabase',
        label: 'Blog post',
        target: '_blank',
      },
    ],
  },
  {
    title: 'Introducing stripe-sync-engine npm package',
    description: '',
    id: 'stripe-engine',
    is_shipped: true,
    links: [
      {
        url: '/blog/stripe-engine-as-sync-library',
        label: 'Blog post',
        target: '_blank',
      },
    ],
  },
  {
    title: 'Improved Security Controls and A New Home for Security',
    description: '',
    id: 'security-homepage',
    is_shipped: true,
    links: [
      {
        url: '/blog/improved-security-controls',
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
