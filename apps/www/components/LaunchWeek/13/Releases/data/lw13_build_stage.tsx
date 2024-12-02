// see apps/www/components/LaunchWeek/X/Releases/data/lwx_advent_days.tsx for reference

import { ReactNode } from 'react'
import { type ClassValue } from 'clsx'

export interface AdventDay {
  icon?: ReactNode // use svg jsx with 34x34px viewport
  className?: ClassValue | string
  id: string
  title: string
  description?: string
  is_shipped: boolean
  links: AdventLink[]
  icons?: AdventLink[]
  type?: string
}

export interface AdventLink {
  url: string
  label?: string
  icon?: any
  target?: '_blank'
}

export const days: AdventDay[] = [
  {
    title: 'OrioleDB Public Alpha',
    description: 'Postgres storage extension with better performance over default Heap storage',
    id: 'orioledb',
    is_shipped: true,
    links: [
      { url: 'https://supabase.com/blog/orioledb-launch', label: 'Blog post', target: '_blank' },
    ],
    icon: null,
  },
  {
    title: '',
    description: '',
    id: '',
    is_shipped: false,
    links: [],
    icon: null,
  },
  {
    title: '',
    description: '',
    id: '',
    is_shipped: false,
    links: [],
    icon: null,
  },
  {
    title: '',
    description: '',
    id: '',
    is_shipped: false,
    links: [],
    icon: null,
  },
]
