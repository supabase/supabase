import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect, FC } from 'react'
import { IconMenu, IconMoon, IconSearch, IconSun, IconCommand, Listbox } from 'ui'
import { useTheme } from 'common/Providers'
import { REFERENCES } from './Navigation.constants'
import { SearchButton } from '../DocSearch'

import { getPageType } from '~/lib/helpers'

const NavBar: FC = () => {
  const { isDarkMode, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { asPath, push } = useRouter()
  const pathSegments = asPath.split('/')

  const library = pathSegments.length >= 3 ? pathSegments[2] : undefined
  const libraryMeta = REFERENCES?.[library] ?? undefined
  const versions = libraryMeta?.versions ?? []

  const version = versions.includes(pathSegments[pathSegments.indexOf(library) + 1])
    ? pathSegments[pathSegments.indexOf(library) + 1]
    : versions[0]

  const pageType = getPageType(asPath)

  useEffect(() => {
    setMounted(true)
  }, [isDarkMode])

  const pageLinks = [
    { text: 'Guides', key: 'docs', link: '/' },
    { text: 'Reference', key: 'reference', link: '/reference' },
  ]

  const toggleDarkMode = () => {
    localStorage.setItem('supabaseDarkMode', (!isDarkMode).toString())
    toggleTheme()

    const key = localStorage.getItem('supabaseDarkMode')
    document.documentElement.className = key === 'true' ? 'dark' : ''
  }

  const onSelectVersion = (version: string) => {
    // [Joshen] Ideally we use <Link> but this works for now
    if (!library) return
    if (version === versions[0]) {
      push(`/reference/${library}`)
    } else {
      push(`/reference/${library}/${version}`)
    }
  }

  // [Joshen] Kaizen: Use UI library's SidePanel for this
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
    const sidebar = document.querySelector('.sidebar-menu-container')
    const contentPane = document.querySelector('.main-content-pane')

    sidebar.classList.toggle('hidden')
    contentPane.classList.toggle('hidden')
  }

  return (
    <nav
      className={[
        'sticky top-0 z-10 flex items-center justify-between',
        'h-[60px] border-b bg-white px-4 backdrop-blur backdrop-filter',
        'dark:border-scale-400 dark:bg-scale-200',
      ].join(' ')}
    >
      <div className="flex items-center">
        <button className="mr-4 block stroke-2 lg:hidden" onClick={toggleMobileMenu}>
          <IconMenu className="text-scale-1100" />
        </button>
        {mounted && (
          <Link href="/">
            <a className="flex items-center">
              <Image
                className="cursor-pointer"
                src={isDarkMode ? '/docs/supabase-dark.svg' : '/docs/supabase-light.svg'}
                width={124}
                height={24}
                alt="Supabase Logo"
              />
            </a>
          </Link>
        )}
        <nav className="ml-8 hidden lg:flex">
          <ul className="hidden space-x-8 lg:flex">
            {pageLinks.map((p) => (
              <li key={`${p.text}-${p.link}`}>
                <Link href={p.link}>
                  <a
                    className={`text-sm ${
                      pageType.includes(p.key) ? 'text-brand-900' : 'text-scale-1100'
                    }`}
                  >
                    {p.text}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {versions.length > 0 && (
          <div className="ml-8">
            <Listbox
              size="small"
              defaultValue={version}
              style={{ width: '70px' }}
              onChange={onSelectVersion}
            >
              {versions.map((version) => (
                <Listbox.Option key={version} label={version} value={version}>
                  {version}
                </Listbox.Option>
              ))}
            </Listbox>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden items-center md:flex">
          <ul className="flex items-center">
            <li className="px-4">
              <a
                href="https://app.supabase.com"
                className="text-scale-1100 text-sm"
                target="_blank"
                rel="noreferrer noopener"
              >
                Dashboard
              </a>
            </li>
            <li className="px-4">
              <a
                href="https://github.com/supabase/supabase"
                target="_blank"
                rel="noreferrer noopener"
              >
                <div
                  className="h-4 w-4 !bg-no-repeat !bg-center"
                  style={{
                    background: isDarkMode
                      ? "url(\"data:image/svg+xml;charset=utf-8,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23fff' d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'/%3E%3C/svg%3E\") 50% no-repeat"
                      : "url(\"data:image/svg+xml;charset=utf-8,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'/%3E%3C/svg%3E\")",
                  }}
                />
              </a>
            </li>
            <li className="px-4">
              <a
                href="https://discord.supabase.com"
                rel="noreferrer noopener"
                target="_blank"
                className="text-scale-1100"
              >
                <div
                  className="h-4 w-4 !bg-no-repeat !bg-center"
                  style={{
                    background: isDarkMode
                      ? "url(\"data:image/svg+xml;charset=utf-8,%3Csvg viewBox='0 0 71 55' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23a)'%3E%3Cpath d='M60.105 4.898A58.55 58.55 0 0 0 45.653.415a.22.22 0 0 0-.233.11 40.784 40.784 0 0 0-1.8 3.697c-5.456-.817-10.886-.817-16.23 0-.485-1.164-1.201-2.587-1.828-3.697a.228.228 0 0 0-.233-.11 58.386 58.386 0 0 0-14.451 4.483.207.207 0 0 0-.095.082C1.578 18.73-.944 32.144.293 45.39a.244.244 0 0 0 .093.167c6.073 4.46 11.955 7.167 17.729 8.962a.23.23 0 0 0 .249-.082 42.08 42.08 0 0 0 3.627-5.9.225.225 0 0 0-.123-.312 38.772 38.772 0 0 1-5.539-2.64.228.228 0 0 1-.022-.378c.372-.279.744-.569 1.1-.862a.22.22 0 0 1 .23-.03c11.619 5.304 24.198 5.304 35.68 0a.219.219 0 0 1 .233.027c.356.293.728.586 1.103.865a.228.228 0 0 1-.02.378 36.384 36.384 0 0 1-5.54 2.637.227.227 0 0 0-.121.315 47.249 47.249 0 0 0 3.624 5.897.225.225 0 0 0 .249.084c5.801-1.794 11.684-4.502 17.757-8.961a.228.228 0 0 0 .092-.164c1.48-15.315-2.48-28.618-10.497-40.412a.18.18 0 0 0-.093-.084Zm-36.38 32.427c-3.497 0-6.38-3.211-6.38-7.156 0-3.944 2.827-7.156 6.38-7.156 3.583 0 6.438 3.24 6.382 7.156 0 3.945-2.827 7.156-6.381 7.156Zm23.593 0c-3.498 0-6.38-3.211-6.38-7.156 0-3.944 2.826-7.156 6.38-7.156 3.582 0 6.437 3.24 6.38 7.156 0 3.945-2.798 7.156-6.38 7.156Z' fill='%23fff'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='a'%3E%3Cpath fill='%23fff' d='M0 0h71v55H0z'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E\") 50% no-repeat"
                      : "url(\"data:image/svg+xml;charset=utf-8,%3Csvg viewBox='0 0 71 55' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23a)'%3E%3Cpath d='M60.105 4.898A58.55 58.55 0 0 0 45.653.415a.22.22 0 0 0-.233.11 40.784 40.784 0 0 0-1.8 3.697c-5.456-.817-10.886-.817-16.23 0-.485-1.164-1.201-2.587-1.828-3.697a.228.228 0 0 0-.233-.11 58.386 58.386 0 0 0-14.451 4.483.207.207 0 0 0-.095.082C1.578 18.73-.944 32.144.293 45.39a.244.244 0 0 0 .093.167c6.073 4.46 11.955 7.167 17.729 8.962a.23.23 0 0 0 .249-.082 42.08 42.08 0 0 0 3.627-5.9.225.225 0 0 0-.123-.312 38.772 38.772 0 0 1-5.539-2.64.228.228 0 0 1-.022-.378c.372-.279.744-.569 1.1-.862a.22.22 0 0 1 .23-.03c11.619 5.304 24.198 5.304 35.68 0a.219.219 0 0 1 .233.027c.356.293.728.586 1.103.865a.228.228 0 0 1-.02.378 36.384 36.384 0 0 1-5.54 2.637.227.227 0 0 0-.121.315 47.249 47.249 0 0 0 3.624 5.897.225.225 0 0 0 .249.084c5.801-1.794 11.684-4.502 17.757-8.961a.228.228 0 0 0 .092-.164c1.48-15.315-2.48-28.618-10.497-40.412a.18.18 0 0 0-.093-.084Zm-36.38 32.427c-3.497 0-6.38-3.211-6.38-7.156 0-3.944 2.827-7.156 6.38-7.156 3.583 0 6.438 3.24 6.382 7.156 0 3.945-2.827 7.156-6.381 7.156Zm23.593 0c-3.498 0-6.38-3.211-6.38-7.156 0-3.944 2.826-7.156 6.38-7.156 3.582 0 6.437 3.24 6.38 7.156 0 3.945-2.798 7.156-6.38 7.156Z' fill='%2323272A'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='a'%3E%3Cpath fill='%23fff' d='M0 0h71v55H0z'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E\")",
                  }}
                />
              </a>
            </li>
            <li className="px-4">
              <a href="https://twitter.com/supabase" target="_blank" rel="noreferrer noopener">
                <div
                  className="h-4 w-4 !bg-no-repeat !bg-center"
                  style={{
                    background: isDarkMode
                      ? "url(\"data:image/svg+xml;charset=utf-8,%3Csvg viewBox='0 0 335 276' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23fff' d='M302 70A195 195 0 0 1 3 245a142 142 0 0 0 97-30 70 70 0 0 1-58-47 70 70 0 0 0 31-2 70 70 0 0 1-57-66 70 70 0 0 0 28 5 70 70 0 0 1-18-90 195 195 0 0 0 141 72 67 67 0 0 1 116-62 117 117 0 0 0 43-17 65 65 0 0 1-31 38 117 117 0 0 0 39-11 65 65 0 0 1-32 35'/%3E%3C/svg%3E\") 50% no-repeat"
                      : "url(\"data:image/svg+xml;charset=utf-8,%3Csvg viewBox='0 0 335 276' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M302 70A195 195 0 0 1 3 245a142 142 0 0 0 97-30 70 70 0 0 1-58-47 70 70 0 0 0 31-2 70 70 0 0 1-57-66 70 70 0 0 0 28 5 70 70 0 0 1-18-90 195 195 0 0 0 141 72 67 67 0 0 1 116-62 117 117 0 0 0 43-17 65 65 0 0 1-31 38 117 117 0 0 0 39-11 65 65 0 0 1-32 35'/%3E%3C/svg%3E\")",
                  }}
                />
              </a>
            </li>
            <li className="px-4">
              <div className="cursor-pointer" onClick={toggleDarkMode}>
                {isDarkMode ? (
                  <IconMoon size={18} strokeWidth={2} className="text-scale-1200" />
                ) : (
                  <IconSun size={18} strokeWidth={2} className="text-scale-1200" />
                )}
              </div>
            </li>
          </ul>
        </div>
        <SearchButton>
          <div className="flex items-center justify-between space-x-6 bg-scale-300 border border-scale-700 pl-3 pr-1.5 py-1.5 rounded">
            <div className="flex items-center space-x-2">
              <IconSearch className="text-scale-1100" size={18} strokeWidth={2} />
              <p className="text-scale-800 text-sm">Search</p>
            </div>
            <div className="flex items-center space-x-1">
              <div className="hidden text-scale-1200 md:flex items-center justify-center h-6 w-6 rounded bg-scale-500">
                <IconCommand size={12} strokeWidth={1.5} />
              </div>
              <div className="hidden text-xs text-scale-1200 md:flex items-center justify-center h-6 w-6 rounded bg-scale-500">
                K
              </div>
            </div>
          </div>
        </SearchButton>
      </div>
    </nav>
  )
}
export default NavBar
