import type { ClassValue } from 'clsx'
import type { ReactNode } from 'react'

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
    title: 'Algolia Connector for Supabase',
    id: 'algolia-connector',
    is_shipped: true,
    links: [
      {
        url: '/blog/algolia-connector-for-supabase',
        label: 'Blog post',
        target: '_blank',
      },
    ],
  },
  {
    title: 'Storage: 10x Larger Uploads, 3x Cheaper Cached Egress & 2x Egress Quota',
    id: 'cheaper-egress',
    is_shipped: true,
    links: [
      {
        url: '/blog/storage-500gb-uploads-cheaper-egress-pricing',
        label: 'Blog post',
        target: '_blank',
      },
    ],
  },
]
