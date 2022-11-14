import { useRouter } from 'next/router'
import { useState } from 'react'

const SideNav = () => {
  console.log('sidebar rerendered')
  const router = useRouter()

  const [level, setLevel] = useState('home')

  const tempBasePath = '/new'

  const home = [
    {
      label: 'Home',
      icon: 'home.svg',
      href: '',
      level: 'home',
    },
    {
      label: 'Getting started',
      icon: 'getting-started.svg',
      level: 'getting-started',
    },
    {
      label: 'Tutorials',
      icon: 'tutorials.svg',
      level: 'tutorials',
    },
    {
      label: 'Database',
      icon: 'database.svg',
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
      level: 'storage',
    },
    {
      label: 'API Reference',
      icon: 'api.svg',
      href: '/ref',
      level: 'ref',
    },
    {
      label: 'Integrations',
      icon: 'integrations.svg',
      level: 'integrations',
    },
    {
      label: 'Platform',
      icon: 'platform.svg',
      level: 'platform',
    },
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
      label: 'supabsae-js',
      icon: 'home.svg',
      href: '/ref/js/start',
      level: 'ref_js',
    },
  ]

  const ref_js = [
    {
      label: 'back to ref',
      icon: 'home.svg',
      href: '/ref',
      level: 'ref',
    },
  ]

  return (
    <div className="flex py-10 px-5">
      {/* // main menu */}
      <div
        className={[
          'absolute transition-all ml-8 duration-200',
          level === 'home' ? 'opacity-100 ml-0 visible' : 'opacity-0 invisible',
        ].join(' ')}
      >
        <ul className="relative w-full flex flex-col gap-2">
          {home.map((link) => {
            return (
              <a
                onClick={() => {
                  setLevel(link.level)
                  router.push(tempBasePath + link.href)
                }}
              >
                <li
                  className={[
                    'flex items-center gap-3',
                    'text-base transition-all duration-200 text-scale-1200 hover:text-brand-900 hover:cursor-pointer ',
                  ].join(' ')}
                >
                  <img src={`${router.basePath}/img/icons/menu/${link.icon}`} />
                  {link.label}
                </li>
              </a>
            )
          })}
        </ul>
      </div>

      {/* // auth menu */}
      <div
        className={[
          'absolute transition-all ml-8 duration-200',
          level === 'auth' ? 'opacity-100 ml-0 visible' : 'opacity-0 invisible',
        ].join(' ')}
      >
        <ul className={'relative w-full flex flex-col gap-2'}>
          {auth.map((link) => {
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
      </div>

      {/* // ref menu */}
      <div
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
      </div>

      {/* // JS menu */}
      <div
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
      </div>
    </div>
  )
}

export default SideNav
