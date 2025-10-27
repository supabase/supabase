// see apps/www/components/LaunchWeek/13/Releases/data/lw13_build_stage.tsx for reference

import { ReactNode } from 'react'
import { type ClassValue } from 'clsx'
import { PRODUCT_MODULES } from 'shared-data/products'
import { AppWindow, Database, Globe } from 'lucide-react'

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
    title: 'Postgres Language Server',
    description: 'Initial Release',
    id: 'clerk',
    is_shipped: true,
    className: 'sm:col-span-2',
    links: [
      {
        url: '/blog/postgres-language-server',
        label: 'Blog post',
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
    title: 'Supabase Auth: Bring Your Own Clerk',
    // description: '',
    id: 'clerk',
    is_shipped: true,
    links: [
      {
        url: '/blog/clerk-tpa-pricing',
        label: 'Blog post',
        target: '_blank',
      },
    ],
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19.3498 21C22.1112 21 24.3498 18.7614 24.3498 16C24.3498 13.2386 22.1112 11 19.3498 11C16.5884 11 14.3499 13.2386 14.3499 16C14.3499 18.7614 16.5884 21 19.3498 21Z"
          fill="hsl(var(--foreground-light))"
        />
        <path
          d="M28.3587 27.8382C28.7841 28.2636 28.7414 28.9679 28.2415 29.3027C25.6984 31.0062 22.6395 31.9997 19.3487 31.9997C16.0578 31.9997 12.9989 31.0062 10.4557 29.3027C9.9559 28.9679 9.91318 28.2636 10.3386 27.8382L13.9925 24.1843C14.3228 23.854 14.8351 23.8019 15.2508 24.0148C16.4799 24.6445 17.8728 24.9997 19.3487 24.9997C20.8245 24.9997 22.2174 24.6445 23.4465 24.0148C23.8622 23.8019 24.3745 23.854 24.7048 24.1843L28.3587 27.8382Z"
          fill="hsl(var(--foreground-light))"
        />
        <path
          d="M28.2424 2.697C28.7422 3.0318 28.7849 3.73609 28.3595 4.16149L24.7056 7.81544C24.3754 8.14569 23.863 8.19785 23.4474 7.98491C22.2183 7.35525 20.8254 7 19.3495 7C14.379 7 10.3496 11.0294 10.3496 16C10.3496 17.4759 10.7048 18.8688 11.3345 20.0979C11.5474 20.5136 11.4953 21.0259 11.165 21.3561L7.51108 25.0101C7.08568 25.4355 6.38139 25.3927 6.04659 24.8929C4.34313 22.3497 3.34961 19.2909 3.34961 16C3.34961 7.16344 10.513 0 19.3495 0C22.6404 0 25.6992 0.993529 28.2424 2.697Z"
          fill="hsl(var(--foreground-light))"
        />
      </svg>
    ),
  },
  {
    title: 'Automatic Embeddings in Postgres',
    description: 'Move the vector generation step into Postgres',
    id: 'automatic-embeddings',
    is_shipped: true,
    links: [
      {
        url: '/blog/automatic-embeddings',
        label: 'Blog post',
        target: '_blank',
      },
    ],
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        className="text-foreground-light group-hover/menu-item:text-foreground group-focus-visible/menu-item:text-foreground"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1"
          d={PRODUCT_MODULES.vector.icon[24]}
          stroke="currentColor"
        />
      </svg>
    ),
  },
  {
    title: "Keeping Tabs: What's New in Supabase Studio",
    description: 'And upgrades to AI Assistant, SQL, and Logs',
    id: 'tabs',
    is_shipped: true,
    links: [
      {
        url: '/blog/tabs-dashboard-updates',
        label: 'Blog post',
        target: '_blank',
      },
    ],
    icon: <AppWindow size={30} />,
  },
  {
    title: 'Dedicated Poolers',
    description: 'Dedicated pgbouncer instance co-located with your database',
    id: 'dedicated-poolers',
    is_shipped: true,
    links: [
      {
        url: '/blog/dedicated-poolers',
        label: 'Blog post',
        target: '_blank',
      },
    ],
    icon: <Database size={30} />,
  },
  {
    title: 'Data API Routes to Nearest Read Replica',
    // description: '',
    id: 'data-api-routes',
    is_shipped: true,
    className: 'sm:col-span-2',
    links: [
      {
        url: '/blog/data-api-nearest-read-replica',
        label: 'Blog post',
        target: '_blank',
      },
    ],
    icon: <Globe size={30} />,
  },
]
