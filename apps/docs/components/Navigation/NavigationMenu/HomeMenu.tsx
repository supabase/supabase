import { useTheme } from 'common/Providers'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment } from 'react'
import { Badge } from '~/../../packages/ui'

const home = [
  [
    {
      label: 'Home',
      icon: '/img/icons/menu/home',
      href: '/',
      level: 'home',
    },
    {
      label: 'Getting Started',
      icon: '/img/icons/menu/getting-started',
      href: '/guides/getting-started',
      level: 'gettingstarted',
    },
  ],
  [
    {
      label: 'Database',
      icon: '/img/icons/menu/database',
      href: '/guides/database',
      level: 'database',
    },
    {
      label: 'Auth',
      icon: '/img/icons/menu/auth',
      href: '/guides/auth/overview',
      level: 'auth',
    },
    {
      label: 'Edge Functions',
      icon: '/img/icons/menu/functions',
      href: '/guides/functions',
      level: 'functions',
    },
    {
      label: 'Realtime',
      icon: '/img/icons/menu/realtime',
      href: '/guides/realtime',
      level: 'realtime',
    },
    {
      label: 'Storage',
      icon: '/img/icons/menu/storage',
      href: '/guides/storage',
      level: 'storage',
    },
  ],
  [
    {
      label: 'Platform',
      icon: '/img/icons/menu/platform',
      href: '/guides/platform',
      level: 'platform',
    },
    {
      label: 'Resources',
      icon: '/img/icons/menu/platform',
      href: '/guides/resources',
      level: 'resources',
    },
    {
      label: 'Self-Hosting',
      icon: '/img/icons/menu/platform',
      href: '/guides/self-hosting',
      level: 'self_hosting',
    },
    {
      label: 'Integrations',
      icon: '/img/icons/menu/integrations',
      hasLightIcon: true,
      href: '/guides/integrations',
      level: 'integrations',
    },
  ],
  [
    {
      label: 'Client Library Reference',
    },
    {
      label: 'JavaScript',
      icon: '/img/icons/menu/reference-javascript',
      href: '/reference/javascript/introduction',
      level: 'reference_javascript',
    },
    {
      label: 'Flutter',
      icon: '/img/icons/menu/reference-dart',
      href: '/reference/dart/introduction',
      level: 'reference_dart',
    },
    {
      label: 'Python',
      icon: '/img/icons/menu/reference-python',
      href: '/reference/python/introduction',
      level: 'reference_python',
      community: true,
    },
    {
      label: 'C#',
      icon: '/img/icons/menu/reference-csharp',
      href: '/reference/csharp/introduction',
      level: 'reference_csharp',
      community: true,
    },
    {
      label: 'Tools',
    },
    {
      label: 'Management API',
      icon: '/img/icons/menu/reference-api',
      href: '/reference/api/introduction',
      level: 'reference_javascript',
    },
    {
      label: 'Supabase CLI',
      icon: '/img/icons/menu/reference-cli',
      href: '/guides/cli',
      level: 'reference_javascript',
    },
  ],
]

const NavigationMenuHome = ({ active }) => {
  const router = useRouter()
  const { isDarkMode } = useTheme()

  return (
    <div
      className={[
        'transition-all duration-150 ease-out',
        active ? 'opacity-100 ml-0 delay-150' : 'opacity-0 -ml-8 invisible absolute',
      ].join(' ')}
    >
      <ul className="relative w-full flex flex-col gap-4">
        {home.map((section, sectionIndex) => {
          return (
            <Fragment key={`section-container-${sectionIndex}-border`}>
              {sectionIndex !== 0 && (
                <div
                  className="h-px w-full bg-blackA-300 dark:bg-whiteA-300"
                  key={`section-${sectionIndex}-border`}
                ></div>
              )}
              <div key={`section-${sectionIndex}`}>
                <div className="flex flex-col gap-3">
                  {section.map((link) => {
                    if (!link.href) {
                      return (
                        <span
                          key={link.label}
                          className="font-mono uppercase text-xs text-scale-900"
                        >
                          {link.label}
                        </span>
                      )
                    } else {
                      return (
                        <Link href={link.href} passHref key={link.label}>
                          <a>
                            <li
                              className={[
                                'group flex items-center gap-3',
                                'text-base transition-all duration-150 text-scale-1200 hover:text-brand-900 hover:cursor-pointer ',
                              ].join(' ')}
                            >
                              <Image
                                alt={link.label}
                                src={`${router.basePath}${
                                  isDarkMode ? link.icon : `${link.icon}-light`
                                }${!link.icon.includes('png') ? '.svg' : ''}`}
                                width={17}
                                height={17}
                                className="w-4 h-4 group-hover:scale-110 ease-out transition-all"
                              />
                              {link.label}
                              {link.community && <Badge size="small">Community</Badge>}
                            </li>
                          </a>
                        </Link>
                      )
                    }
                  })}
                </div>
              </div>
            </Fragment>
          )
        })}
      </ul>
    </div>
  )
}

export default NavigationMenuHome
