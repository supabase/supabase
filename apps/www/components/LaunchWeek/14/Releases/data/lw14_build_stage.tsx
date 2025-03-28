// see apps/www/components/LaunchWeek/13/Releases/data/lw13_build_stage.tsx for reference

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
  {
    title: '',
    description: '',
    id: '',
    is_shipped: false,
    links: [],
    icon: null,
  },
]
