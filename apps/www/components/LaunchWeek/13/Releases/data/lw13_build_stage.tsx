// see apps/www/components/LaunchWeek/X/Releases/data/lwx_advent_days.tsx for reference

import { ReactNode } from 'react'
import { type ClassValue } from 'clsx'
import { GitBranch, HardDrive, BookCopy, Flag } from 'lucide-react'

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
    description: 'A better Postgres storage engine replacing Heap storage',
    id: 'orioledb',
    is_shipped: true,
    className: 'xl:col-span-2',
    links: [
      {
        url: '/blog/orioledb-launch',
        label: 'Blog post',
        target: '_blank',
      },
    ],
    icon: (
      <svg
        width="49"
        height="50"
        viewBox="0 0 49 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M32.3419 16.1687C26.9198 19.0762 22.2245 19.1919 20.5547 18.8863C24.0908 22.894 28.1618 23.1755 29.7552 22.8152C37.4684 22.442 40.855 13.0158 48.2546 13.2545C46.6043 11.4734 44.4237 11.05 43.5397 11.0609C39.6868 10.8581 35.3857 14.269 32.3419 16.1687Z"
          fill="hsl(var(--foreground-light))"
        />
        <path
          d="M12.6959 13.353C17.8299 18.0154 25.4872 16.6927 28.6741 15.4485C25.7928 15.1342 22.0602 11.6504 20.554 9.94776C15.0031 4.03282 7.47323 1.59481 0.253906 6.21518C4.37942 6.80454 6.27846 7.52486 12.6959 13.353Z"
          fill="hsl(var(--foreground-light))"
        />
        <path
          d="M24.5485 2.22059C21.6148 -0.555946 15.8172 0.496169 13.2852 1.36929C17.4762 1.36929 22.8022 7.61206 24.9414 10.7334C27.6059 14.037 30.8974 13.9871 32.2101 13.5493C31.1624 12.8158 29.7217 10.1441 29.1324 8.89988C27.194 5.18037 25.2688 2.89722 24.5485 2.22059Z"
          fill="hsl(var(--foreground-light))"
        />
        <path
          d="M31.1956 7.73838C30.7536 5.49555 28.9582 3.13734 27.8886 1.82766C30.4359 1.82766 35.7101 3.85375 34.6335 7.26286C34.162 9.88223 34.0878 12.196 34.1096 13.0255C32.3809 11.7158 31.4532 9.04546 31.1956 7.73838Z"
          fill="hsl(var(--foreground-light))"
        />
      </svg>
    ),
  },
  {
    title: 'Supabase CLI v2: Config as Code',
    description: 'Version control the configuration of your Projects and Branches',
    id: 'cli',
    is_shipped: true,
    links: [
      {
        url: '/blog/cli-v2-config-as-code',
        label: 'Blog post',
        target: '_blank',
      },
    ],
    icon: <GitBranch />,
  },
  {
    title: 'High Performance Disks',
    description: 'Store up to 60 TB of data with 100x improved durability and 5x more IOPS',
    id: 'disk',
    is_shipped: true,
    links: [
      {
        url: '/blog/high-performance-disks',
        label: 'Blog post',
        target: '_blank',
      },
    ],
    icon: <HardDrive />,
  },
  {
    title: 'Restore to a New Project',
    description: 'Effortlessly clone data into a new Supabase project',
    id: 'restore',
    is_shipped: true,
    links: [
      {
        url: '/blog/restore-to-a-new-project',
        label: 'Blog post',
        target: '_blank',
      },
    ],
    icon: <BookCopy />,
  },
  {
    title: 'Hack the Base! with Supabase',
    description: 'Play cool games, win cool prizes',
    id: 'hack',
    is_shipped: true,
    links: [
      {
        url: '/blog/hack-the-base',
        label: 'Blog post',
        target: '_blank',
      },
    ],
    icon: <Flag />,
    className: 'sm:col-span-2 xl:col-span-3',
  },
]
