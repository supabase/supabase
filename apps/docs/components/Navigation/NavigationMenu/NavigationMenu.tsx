import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { IconChevronLeft } from '~/../../packages/ui'
import * as NavItems from './NavigationMenu.constants'
import NavigationMenuGuideList from './NavigationMenuGuideList'

const SideNav = () => {
  console.log('sidebar rerendered')
  const router = useRouter()

  const [level, setLevel] = useState('home')

  const tempBasePath = '/new'

  function handleRouteChange(url: string) {
    console.log('path changed')
    console.log(url)
    console.log('LISTEN')
    switch (url) {
      case `/docs${tempBasePath}`:
        setLevel('home')
        break
      case `/docs${tempBasePath}/getting-started`:
        setLevel('gettingstarted')
        break
      case `/docs${tempBasePath}/tutorials`:
        setLevel('tutorials')
        break
      case `/docs${tempBasePath}/database`:
        setLevel('database')
        break
      case url.includes(`/docs${tempBasePath}/auth`) && url:
        setLevel('auth')
        break
      case `/docs${tempBasePath}/storage`:
        setLevel('storage')
        break
      case `/docs${tempBasePath}/realtime`:
        setLevel('realtime')
        break
      case `/docs${tempBasePath}/edge-functions`:
        setLevel('functions')
        break
      case `/docs${tempBasePath}/reference`:
        setLevel('reference')
        break
      case `/docs${tempBasePath}/integrations`:
        setLevel('integrations')
        break
      case `/docs${tempBasePath}/platform`:
        setLevel('platform')
        break
      case url.includes(`/docs${tempBasePath}/reference/javascript/`) && url:
        setLevel('reference_javascript')
        break

      default:
        break
    }
  }

  useEffect(() => {
    console.log(router)
    handleRouteChange(router.basePath + router.asPath)
    // Listen for page changes after a navigation or when the query changes
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  // handleRouteChange(router.asPath)

  const home = [
    [
      {
        label: 'Home',
        icon: 'home.svg',
        href: '',
        level: 'home',
      },
      {
        label: 'Getting started',
        icon: 'getting-started.svg',
        href: '/getting-started',
        level: 'gettingstarted',
      },
      {
        label: 'Tutorials',
        icon: 'tutorials.svg',
        href: '/tutorials',
        level: 'tutorials',
      },
    ],
    [
      {
        label: 'Database',
        icon: 'database.svg',
        href: '/database',
        level: 'database',
      },
      {
        label: 'Auth',
        icon: 'auth.svg',
        href: '/auth',
        level: 'auth',
      },
      {
        label: 'Storage',
        icon: 'storage.svg',
        href: '/storage',
        level: 'storage',
      },
      {
        label: 'Realtime',
        icon: 'realtime.svg',
        href: '/realtime',
        level: 'realtime',
      },
      {
        label: 'Edge Functions',
        icon: 'functions.svg',
        href: '/edge-functions',
        level: 'functions',
      },
    ],
    [
      {
        label: 'API Reference',
        icon: 'reference.svg',
        href: '/reference',
        level: 'reference',
      },
      {
        label: 'Integrations',
        icon: 'integrations.svg',
        href: '/integrations',
        level: 'integrations',
      },
      {
        label: 'Platform',
        icon: 'platform.svg',
        href: '/platform',
        level: 'platform',
      },
    ],
  ]

  const auth = [
    {
      label: 'back',
      icon: 'home.svg',
      href: '',
      level: 'home',
    },
  ]

  const ref = [
    {
      label: 'back',
      icon: 'home.svg',
      href: '',
      level: 'home',
    },
    {
      label: 'supabase-js v2',
      icon: 'home.svg',
      href: '/reference/javascript/start',
      level: 'ref_js',
    },
    {
      label: 'supabase-js v1',
      icon: 'home.svg',
      href: '/reference/javascript/v1/start',
      level: 'ref_js',
    },
    {
      label: 'supabase-dart v1',
      icon: 'home.svg',
      href: '/reference/dart/start',
      level: 'ref_dart',
    },
  ]

  const ref_js = [
    {
      label: 'back to ref',
      icon: 'home.svg',
      href: '/reference',
      level: 'ref',
    },
  ]

  return (
    <div className="flex relative">
      {/* // main menu */}
      <div
        className={[
          'absolute transition-all duration-150 ease-out',
          level === 'home' ? 'opacity-100 ml-0 delay-150' : 'opacity-0 -ml-8',
          // level !== 'home' && 'opacity-0 invisible'
        ].join(' ')}
      >
        <ul className="relative w-full flex flex-col gap-5">
          {home.map((section, sectionIndex) => {
            return (
              <>
                {sectionIndex !== 0 && (
                  <div
                    className="h-px w-full bg-green-500"
                    key={`section-${sectionIndex}-border`}
                  ></div>
                )}
                <div className="flex flex-col gap-3" key={`section-${sectionIndex}`}>
                  {section.map((link) => {
                    return (
                      <Link href={tempBasePath + link.href} passHref>
                        <a key={link.label}>
                          <li
                            className={[
                              'group flex items-center gap-3',
                              'text-base transition-all duration-150 text-scale-1200 hover:text-brand-900 hover:cursor-pointer ',
                            ].join(' ')}
                          >
                            <img
                              src={`${router.basePath}/img/icons/menu/${link.icon}`}
                              className="opacity-75 w-4.5 group-hover:scale-110 group-hover:opacity-100 ease-out transition-all"
                            />
                            {link.label}
                          </li>
                        </a>
                      </Link>
                    )
                  })}
                </div>
              </>
            )
          })}
        </ul>
      </div>

      <NavigationMenuGuideList
        id={'gettingstarted'}
        currentLevel={level}
        setLevel={setLevel}
        tempBasePath={tempBasePath}
      />
      <NavigationMenuGuideList
        id={'tutorials'}
        currentLevel={level}
        setLevel={setLevel}
        tempBasePath={tempBasePath}
      />
      <NavigationMenuGuideList
        id={'database'}
        currentLevel={level}
        setLevel={setLevel}
        tempBasePath={tempBasePath}
      />
      <NavigationMenuGuideList
        id={'auth'}
        currentLevel={level}
        setLevel={setLevel}
        tempBasePath={tempBasePath}
      />
      <NavigationMenuGuideList
        id={'storage'}
        currentLevel={level}
        setLevel={setLevel}
        tempBasePath={tempBasePath}
      />
      <NavigationMenuGuideList
        id={'realtime'}
        currentLevel={level}
        setLevel={setLevel}
        tempBasePath={tempBasePath}
      />
      <NavigationMenuGuideList
        id={'functions'}
        currentLevel={level}
        setLevel={setLevel}
        tempBasePath={tempBasePath}
      />
      <NavigationMenuGuideList
        id={'reference'}
        currentLevel={level}
        setLevel={setLevel}
        tempBasePath={tempBasePath}
      />
      <NavigationMenuGuideList
        id={'integrations'}
        currentLevel={level}
        setLevel={setLevel}
        tempBasePath={tempBasePath}
      />
      <NavigationMenuGuideList
        id={'platform'}
        currentLevel={level}
        setLevel={setLevel}
        tempBasePath={tempBasePath}
      />

      {/* reference level */}
      <NavigationMenuGuideList
        id={'reference_javascript'}
        currentLevel={level}
        setLevel={setLevel}
        tempBasePath={tempBasePath}
      />

      {/* // ref menu */}
      {/* <div
        className={[
          'absolute transition-all ml-8 duration-200',
          level === 'ref' ? 'opacity-100 ml-0 visible' : 'opacity-0 invisible',
        ].join(' ')}
      >
        <ul className={'relative w-full flex flex-col gap-2'}>
          {ref.map((link) => {
            return (
              <li
                onClick={() => {
                  setLevel(link.level)
                  router.push(tempBasePath + link.href)
                }}
                className={[
                  'flex items-center gap-3',
                  'text-base transition-all duration-200 text-scale-1200 hover:text-brand-900 hover:cursor-pointer ',
                ].join(' ')}
              >
                <img src={`${router.basePath}/img/icons/menu/${link.icon}`} />
                {link.label}
              </li>
            )
          })}
        </ul>
      </div> */}

      {/* // JS menu */}
      {/* <div
        className={[
          'absolute transition-all ml-8 duration-200',
          level === 'ref_js' ? 'opacity-100 ml-0 visible' : 'opacity-0 invisible',
        ].join(' ')}
      >
        <ul className={'relative w-full flex flex-col gap-2'}>
          {ref_js.map((link) => {
            return (
              <li
                onClick={() => {
                  setLevel(link.level)
                  router.push(tempBasePath + link.href)
                }}
                className={[
                  'flex items-center gap-3',
                  'text-base transition-all duration-200 text-scale-1200 hover:text-brand-900 hover:cursor-pointer ',
                ].join(' ')}
              >
                <img src={`${router.basePath}/img/icons/menu/${link.icon}`} />
                {link.label}
              </li>
            )
          })}
        </ul>
      </div> */}

      {/* // Dart menu */}
      {/* <div
        className={[
          'absolute transition-all ml-8 duration-200',
          level === 'ref_dart' ? 'opacity-100 ml-0 visible' : 'opacity-0 invisible',
        ].join(' ')}
      >
        <ul className={'relative w-full flex flex-col gap-2'}>
          {ref_js.map((link) => {
            return (
              <li
                onClick={() => {
                  setLevel(link.level)
                  router.push(tempBasePath + link.href)
                }}
                className={[
                  'flex items-center gap-3',
                  'text-base transition-all duration-200 text-scale-1200 hover:text-brand-900 hover:cursor-pointer ',
                ].join(' ')}
              >
                <img src={`${router.basePath}/img/icons/menu/${link.icon}`} />
                {link.label}
              </li>
            )
          })}
        </ul>
      </div> */}
    </div>
  )
}

export default SideNav
