import { useTheme } from 'common/Providers'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { memo, useEffect, useState } from 'react'
import NavigationMenuGuideList from './NavigationMenuGuideList'
import NavigationMenuRefList from './NavigationMenuRefList'

// @ts-expect-error
import spec_js_v2 from '~/../../spec/supabase_js_v2.yml' assert { type: 'yml' }
// @ts-expect-error
import spec_js_v1 from '~/../../spec/supabase_js_v1.yml' assert { type: 'yml' }
// @ts-expect-error
import spec_dart_v1 from '~/../../spec/supabase_dart_v1.yml' assert { type: 'yml' }
// @ts-expect-error
import spec_dart_v0 from '~/../../spec/supabase_dart_v0.yml' assert { type: 'yml' }

// import { gen_v3 } from '~/lib/refGenerator/helpers'
import libCommonSections from '~/../../spec/common-client-libs-sections.json'
import apiCommonSections from '~/../../spec/common-api-sections.json'
import cliCommonSections from '~/../../spec/common-cli-sections.json'
import authServerCommonSections from '~/../../spec/common-self-hosting-auth-sections.json'
import storageServerCommonSections from '~/../../spec/common-self-hosting-storage-sections.json'
import realtimeServerCommonSections from '~/../../spec/common-self-hosting-realtime-sections.json'
import { flattenSections } from '~/lib/helpers'

// Filter libCommonSections for just the relevant sections in the current library
function generateAllowedClientLibKeys(sections, spec) {
  // Filter parent sections first

  const specIds = spec.functions.map((func) => {
    return func.id
  })

  const newShape = flattenSections(sections).filter((section) => {
    if (specIds.includes(section.id)) {
      return section
    }
  })

  const final = newShape.map((func) => {
    return func.id
  })

  return final
}

export type RefIdOptions =
  | 'reference_javascript_v1'
  | 'reference_javascript_v2'
  | 'reference_dart_v0'
  | 'reference_dart_v1'
  | 'reference_cli'
  | 'reference_api'
  | 'reference_self_hosting_auth'
  | 'reference_self_hosting_storage'
  | 'reference_self_hosting_realtime'

export type RefKeyOptions =
  | 'javascript'
  | 'dart'
  | 'cli'
  | 'api'
  | 'self-hosting-auth'
  | 'self-hosting-storage'
  | 'self-hosting-realtime'

const SideNav = () => {
  const router = useRouter()
  const { isDarkMode } = useTheme()
  const [level, setLevel] = useState('home')

  let version = ''

  if (router.asPath.includes('v1')) {
    version = '_v1'
  }

  if (router.asPath.includes('v0')) {
    version = '_v0'
  }

  function handleRouteChange(url: string) {
    switch (url) {
      case `/docs`:
        setLevel('home')
        break
      case url.includes(`/docs/getting-started`) && url:
        setLevel('gettingstarted')
        break
      case url.includes(`/docs/guides/tutorials`) && url:
        setLevel('tutorials')
        break
      case url.includes(`/docs/guides/database`) && url:
        setLevel('database')
        break
      case url.includes(`/docs/guides/auth`) && url:
        setLevel('auth')
        break
      case url.includes(`/docs/guides/functions`) && url:
        setLevel('functions')
        break
      case url.includes(`/docs/guides/realtime`) && url:
        setLevel('realtime')
        break
      case url.includes(`/docs/guides/storage`) && url:
        setLevel('storage')
        break
      case url.includes(`/docs/guides/platform`) ||
        (url.includes(`/docs/guides/hosting/platform`) && url):
        setLevel('platform')
        break
      case url.includes(`/docs/guides/resources`) && url:
        setLevel('resources')
        break
      case url.includes(`/docs/guides/integrations`) && url:
        setLevel('integrations')
        break
      // JS v1
      case url.includes(`/docs/reference/javascript/v1`) && url:
        setLevel('reference_javascript_v1')
        break
      // JS v2 (latest)
      case url.includes(`/docs/reference/javascript`) && url:
        setLevel('reference_javascript_v2')
        break
      // dart v0
      case url.includes(`/docs/reference/dart/v0`) && url:
        setLevel('reference_dart_v0')
        break
      // dart v1 (latest)
      case url.includes(`/docs/reference/dart`) && url:
        setLevel('reference_dart_v1')
        break
      case url.includes(`/docs/reference/cli`) && url:
        setLevel('reference_cli')
        break
      case url.includes(`/docs/reference/api`) && url:
        setLevel('reference_api')
        break
      case url.includes(`/docs/reference/self-hosting-auth`) && url:
        setLevel('reference_self_hosting_auth')
        break
      case url.includes(`/docs/reference/self-hosting-storage`) && url:
        setLevel('reference_self_hosting_storage')
        break
      case url.includes(`/docs/reference/self-hosting-realtime`) && url:
        setLevel('reference_self_hosting_realtime')
        break

      default:
        break
    }
  }

  useEffect(() => {
    handleRouteChange(router.basePath + router.asPath)
    // Listen for page changes after a navigation or when the query changes
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

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
        href: '/getting-started',
        level: 'gettingstarted',
      },
      {
        label: 'Tutorials',
        icon: '/img/icons/menu/tutorials',
        href: '/guides/tutorials',
        level: 'tutorials',
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
        href: '/guides/hosting/platform',
        level: 'platform',
      },
      {
        label: 'Resources',
        icon: '/img/icons/menu/platform',
        href: '/guides/resources',
        level: 'resources',
      },
      {
        label: 'Integrations',
        icon: '/img/icons/menu/integrations',
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
        hasLightIcon: true,
        href: '/reference/javascript/introduction',
        level: 'reference_javascript',
      },
      // {
      //   label: 'Python Client Library',
      //   icon: '/img/icons/python-icon',
      //   hasLightIcon: false,
      //   href: '/reference/javascript/start',
      //   level: 'reference_javascript',
      // },
      {
        label: 'Flutter',
        icon: '/img/icons/menu/reference-dart',
        hasLightIcon: true,
        href: '/reference/dart/introduction',
        level: 'reference_dart',
      },
      {
        label: 'Tools Reference',
      },
      {
        label: 'Management API',
        icon: '/img/icons/menu/reference-api',
        hasLightIcon: true,
        href: '/reference/api/introduction',
        level: 'reference_javascript',
      },
      {
        label: 'Supabase CLI',
        icon: '/img/icons/menu/reference-cli',
        hasLightIcon: true,
        href: '/reference/cli/introduction',
        level: 'reference_javascript',
      },
      // {
      //   label: 'Self-Hosting Reference',
      // },
      // {
      //   label: 'Self-Hosting Auth',
      //   icon: '/img/icons/menu/reference-auth',
      //   hasLightIcon: true,
      //   href: '/reference/self-hosting-auth/introduction',
      //   level: 'reference_self_hosting_auth',
      // },
      // {
      //   label: 'Self-Hosting Storage',
      //   hasLightIcon: true,
      //   icon: '/img/icons/menu/reference-storage',
      //   href: '/reference/self-hosting-storage/introduction',
      //   level: 'reference_self_hosting_auth',
      // },
      // {
      //   label: 'Self-Hosting Realtime',
      //   hasLightIcon: true,
      //   icon: '/img/icons/menu/reference-realtime',
      //   href: '/reference/self-hosting-realtime/introduction',
      //   level: 'reference_self_hosting_auth',
      // },
    ],
  ]

  // generate Open API specs

  // @ts-ignore
  // const apiSpec = gen_v3(apiSpecRaw, 'wat', { apiUrl: 'apiv0' })

  return (
    <div className="flex relative">
      {/* // main menu */}
      <div
        className={[
          '',
          'transition-all duration-150 ease-out',
          level === 'home' ? 'opacity-100 ml-0 delay-150' : 'opacity-0 -ml-8 invisible absolute',
          // level !== 'home' && 'opacity-0 invisible'
        ].join(' ')}
      >
        <ul className="relative w-full flex flex-col gap-4">
          {home.map((section, sectionIndex) => {
            return (
              <>
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
                                    Object.hasOwn(link, 'hasLightIcon') && !link.hasLightIcon
                                      ? link.icon
                                      : isDarkMode
                                      ? link.icon
                                      : `${link.icon}-light`
                                  }${!link.icon.includes('png') ? '.svg' : ''}`}
                                  width={17}
                                  height={17}
                                  className="opacity-75 w-4 h-4 group-hover:scale-110 group-hover:opacity-100 ease-out transition-all"
                                />
                                {link.label}
                              </li>
                            </a>
                          </Link>
                        )
                      }
                    })}
                  </div>
                </div>
              </>
            )
          })}
        </ul>
      </div>

      <NavigationMenuGuideList id={'gettingstarted'} currentLevel={level} />
      <NavigationMenuGuideList id={'tutorials'} currentLevel={level} />
      <NavigationMenuGuideList id={'database'} currentLevel={level} />
      <NavigationMenuGuideList id={'auth'} currentLevel={level} />
      <NavigationMenuGuideList id={'functions'} currentLevel={level} />
      <NavigationMenuGuideList id={'realtime'} currentLevel={level} />
      <NavigationMenuGuideList id={'storage'} currentLevel={level} />
      <NavigationMenuGuideList id={'platform'} currentLevel={level} />
      <NavigationMenuGuideList id={'resources'} currentLevel={level} />
      <NavigationMenuGuideList id={'integrations'} currentLevel={level} />
      <NavigationMenuGuideList id={'reference'} currentLevel={level} />
      {/* // Client Libs */}
      <NavigationMenuRefList
        key={'reference-js-menu'}
        id={'reference_javascript_v1'}
        currentLevel={level}
        commonSections={libCommonSections}
        lib="javascript"
        allowedClientKeys={generateAllowedClientLibKeys(libCommonSections, spec_js_v1)}
      />
      <NavigationMenuRefList
        key={'reference-js-menu'}
        id={'reference_javascript_v2'}
        currentLevel={level}
        commonSections={libCommonSections}
        lib="javascript"
        allowedClientKeys={generateAllowedClientLibKeys(libCommonSections, spec_js_v2)}
      />
      <NavigationMenuRefList
        key={'reference-dart-menu'}
        id={'reference_dart_v0'}
        currentLevel={level}
        commonSections={libCommonSections}
        lib="dart"
        allowedClientKeys={generateAllowedClientLibKeys(libCommonSections, spec_dart_v0)}
      />
      <NavigationMenuRefList
        key={'reference-dart-menu'}
        id={'reference_dart_v1'}
        currentLevel={level}
        commonSections={libCommonSections}
        lib="dart"
        allowedClientKeys={generateAllowedClientLibKeys(libCommonSections, spec_dart_v1)}
      />
      {/* // Tools */}
      <NavigationMenuRefList
        key={'reference-cli-menu'}
        id={'reference_cli'}
        currentLevel={level}
        commonSections={cliCommonSections}
        lib="cli"
      />
      <NavigationMenuRefList
        key={'reference-api-menu'}
        id={'reference_api'}
        currentLevel={level}
        commonSections={apiCommonSections}
        lib="api"
      />
      {/* // Self Hosting Server */}
      <NavigationMenuRefList
        key={'reference-self-hosting-auth-menu'}
        id={'reference_self_hosting_auth'}
        currentLevel={level}
        commonSections={authServerCommonSections}
        lib="self-hosting-auth"
      />
      <NavigationMenuRefList
        key={'reference-self-hosting-storage-menu'}
        id={'reference_self_hosting_storage'}
        currentLevel={level}
        commonSections={storageServerCommonSections}
        lib="self-hosting-storage"
      />
      <NavigationMenuRefList
        key={'reference-self-hosting-realtime-menu'}
        id={'reference_self_hosting_realtime'}
        currentLevel={level}
        commonSections={realtimeServerCommonSections}
        lib="self-hosting-auth"
      />
    </div>
  )
}

export default memo(SideNav)
