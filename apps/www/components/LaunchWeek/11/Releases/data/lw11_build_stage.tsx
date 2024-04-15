// see apps/www/components/LaunchWeek/X/Releases/data/lwx_advent_days.tsx for reference

import { ReactNode } from 'react'

export interface AdventDay {
  icon?: ReactNode // use svg jsx with 34x34px viewport
  className?: string
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
    title: 'PostgreSQL Index Advisor',
    description: 'A PostgreSQL extension for recommending indexes to improve query performance.',
    id: 'pg-index-advisor',
    is_shipped: true,
    links: [
      {
        url: 'https://github.com/supabase/index_advisor',
        label: 'Learn more',
        target: '_blank',
      },
    ],
    icon: (
      <svg
        width="34"
        height="32"
        viewBox="0 0 34 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3.43881 3.75378C4.10721 1.93324 5.84055 0.723145 7.77992 0.723145H15.6033V0.734736H17.0394C23.8756 0.734736 29.4173 6.27652 29.4173 13.1127V20.1749C29.4173 20.7272 28.9696 21.1749 28.4173 21.1749C27.8651 21.1749 27.4173 20.7272 27.4173 20.1749V13.1127C27.4173 7.38109 22.771 2.73474 17.0394 2.73474H15.4396C15.3877 2.73474 15.3366 2.73078 15.2868 2.72314H7.77992C6.6793 2.72314 5.6956 3.40989 5.31627 4.44308L2.7812 11.3479C2.37375 12.4577 2.69516 13.7038 3.58855 14.4781L5.32807 15.9856C6.12772 16.6786 6.58711 17.6847 6.58709 18.7428L6.58706 21.5134C6.58702 23.8192 8.45627 25.6885 10.7621 25.6885C11.4007 25.6885 11.9184 25.1708 11.9184 24.5322L11.9185 12.1874C11.9185 9.59233 12.955 7.10481 14.7977 5.27761C15.1899 4.88873 15.823 4.8914 16.2119 5.28357C16.6008 5.67574 16.5981 6.3089 16.2059 6.69777C14.742 8.14943 13.9185 10.1257 13.9185 12.1874L13.9184 24.5323C13.9184 26.2754 12.5053 27.6885 10.7621 27.6885C7.35169 27.6885 4.58701 24.9238 4.58706 21.5134L4.58709 18.7428C4.5871 18.2647 4.37953 17.8101 4.01822 17.497L2.27871 15.9894C0.757203 14.6708 0.209829 12.5486 0.90374 10.6586L3.43881 3.75378ZM16.539 18.5225C17.0348 18.2791 17.634 18.4838 17.8773 18.9796C19.1969 21.6686 21.9313 23.3727 24.9267 23.3726L32.8043 23.3726C33.3566 23.3725 33.8043 23.8203 33.8043 24.3725C33.8044 24.9248 33.3566 25.3725 32.8044 25.3726L29.4081 25.3726C29.4142 25.4172 29.4173 25.4628 29.4173 25.5091C29.4173 29.0627 26.1868 31.4165 22.6091 31.4165C19.2966 31.4165 16.5385 29.0518 15.9271 25.9188C15.8213 25.3767 16.175 24.8516 16.717 24.7458C17.2591 24.64 17.7843 24.9936 17.89 25.5357C18.3217 27.7475 20.2716 29.4165 22.6091 29.4165C25.447 29.4165 27.4173 27.6256 27.4173 25.5091C27.4173 25.4628 27.4205 25.4172 27.4266 25.3726L24.9267 25.3726C21.1684 25.3727 17.7375 23.2346 16.0818 19.8607C15.8385 19.3649 16.0432 18.7658 16.539 18.5225Z"
          fill="hsl(var(--foreground-light))"
        />
        <path
          d="M21.7224 13.0006C21.7224 13.6338 22.2358 14.1472 22.869 14.1472C23.5022 14.1472 24.0156 13.6338 24.0156 13.0006C24.0156 12.3674 23.5022 11.854 22.869 11.854C22.2358 11.854 21.7224 12.3674 21.7224 13.0006Z"
          fill="hsl(var(--foreground-light))"
        />
      </svg>
    ),
  },
  {
    title: '',
    description: '',
    id: '',
    is_shipped: false,
    links: [
      {
        url: '',
        label: 'Learn more',
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
    title: '',
    description: '',
    icon: null,
    id: '',
    is_shipped: false,
    links: [
      {
        url: '',
        label: 'Learn more',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    icon: null,
    id: '',
    is_shipped: false,
    links: [
      {
        url: '',
        label: 'Learn more',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    icon: null,
    id: '',
    is_shipped: false,
    links: [
      {
        url: '',
        label: 'Learn more',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    icon: null,
    id: '',
    is_shipped: false,
    links: [
      {
        url: '',
        label: 'Learn more',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    icon: null,
    id: '',
    is_shipped: false,
    links: [
      {
        url: '',
        label: 'Learn more',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    icon: null,
    id: '',
    is_shipped: false,
    links: [
      {
        url: '',
        label: 'Learn more',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    icon: null,
    id: '',
    is_shipped: false,
    links: [
      {
        url: '',
        label: 'Learn more',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    icon: null,
    id: '',
    is_shipped: false,
    links: [
      {
        url: '',
        label: 'Learn more',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    icon: null,
    id: '',
    is_shipped: false,
    links: [
      {
        url: '',
        label: 'Learn more',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    icon: null,
    id: '',
    is_shipped: false,
    links: [
      {
        url: '',
        label: 'Learn more',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    icon: null,
    id: '',
    is_shipped: false,
    links: [
      {
        url: '',
        label: 'Learn more',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    icon: null,
    id: '',
    is_shipped: false,
    links: [
      {
        url: '',
        label: 'Learn more',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    icon: null,
    id: '',
    is_shipped: false,
    links: [
      {
        url: '',
        label: 'Learn more',
        target: '_blank',
      },
    ],
  },
  {
    title: '',
    description: '',
    icon: null,
    id: '',
    is_shipped: false,
    links: [
      {
        url: '',
        label: 'Learn more',
        target: '_blank',
      },
    ],
  },
]
