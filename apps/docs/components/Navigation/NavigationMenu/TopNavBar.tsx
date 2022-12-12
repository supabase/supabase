import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FC, useEffect, useState } from 'react'
import { Button, IconCommand, IconMenu, IconMoon, IconSearch, IconSun, Input, Listbox } from 'ui'
import { SearchButton } from '~/components/DocSearch'
import { REFERENCES } from '~/components/Navigation/Navigation.constants'
import { useTheme } from 'common/Providers'

import { getPageType } from '~/lib/helpers'

const TopNavBar: FC = () => {
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
    <nav className="h-[60px] border-b px-4 backdrop-blur backdrop-filter bg-white-1200 dark:bg-blackA-300">
      <div className="max-w-[1400px] grid grid-cols-12 mx-auto gap-4 px-5 h-full">
        <div className="col-span-3 flex items-center">
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
        <div className="col-span-5 flex items-center">
          <div className="max-w-xl grow">
            <SearchButton className="w-full">
              <div
                className="
              flex
              group
              items-center
              justify-between
              bg-scaleA-200
              border
              transition
              hover:border-scale-600
              hover:bg-scaleA-300
              border-scale-500 pl-3 pr-1.5 w-full h-[32px] rounded"
              >
                <div className="flex items-center space-x-2">
                  <IconSearch className="text-scale-1100" size={18} strokeWidth={2} />
                  <p className="text-scale-1100 text-sm group-hover:text-scale-1200 transition">
                    Search docs...
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="text-scale-1200 md:flex items-center justify-center h-5 w-10 border rounded bg-scale-500 border-scale-700 gap-1">
                    <IconCommand size={12} strokeWidth={1.5} />
                    <span className="text-[12px]">K</span>
                  </div>
                </div>
              </div>
            </SearchButton>
          </div>
        </div>
        <div className="col-span-4 flex items-center justify-end gap-3">
          <Button
            type="outline"
            as="a"
            // @ts-ignore
            href="https://app.supabase.com"
            className="text-scale-1100 text-sm"
            target="_blank"
            rel="noreferrer noopener"
          >
            Go to Dashboard
          </Button>
          <ul className="flex items-center">
            <li className="px-4">
              <div className="cursor-pointer" onClick={toggleDarkMode}>
                {isDarkMode ? (
                  <IconMoon
                    size={16}
                    strokeWidth={1}
                    className="text-scale-1100 hover:text-scale-1200 transition"
                  />
                ) : (
                  <IconSun
                    size={16}
                    strokeWidth={1}
                    className="text-scale-1100 hover:text-scale-1200 transition"
                  />
                )}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
export default TopNavBar
