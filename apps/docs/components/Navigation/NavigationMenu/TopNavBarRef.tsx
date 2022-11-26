import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FC, useEffect, useState } from 'react'
import {
  Badge,
  Button,
  Dropdown,
  IconCommand,
  IconMenu,
  IconMessageSquare,
  IconMoon,
  IconSearch,
  IconSun,
  Input,
  Listbox,
} from 'ui'
import { SearchButton } from '~/components/DocSearch'
import { REFERENCES } from '~/components/Navigation/Navigation.constants'
import { useTheme } from '~/components/Providers'

import { getPageType } from '~/lib/helpers'

const TopNavBarRef: FC = () => {
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
    <nav className="h-[60px] border-b backdrop-blur backdrop-filter bg-white-1200 dark:bg-blackA-300">
      <div className="px-5 max-w-7xl mx-auto flex items-center h-full">
        <div className="col-span-3 flex items-center">
          <button className="mr-4 block stroke-2 lg:hidden" onClick={toggleMobileMenu}>
            <IconMenu className="text-scale-1100" />
          </button>
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
        <div className="flex items-center gap-12">
          <SearchButton className="w-96">
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

          {/* <div className="flex items-center -space-x-px">
            <div className="w-64">
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
              border-scale-500 pl-3 pr-1.5 w-full h-[32px] rounded
              rounded-tr-none
              rounded-br-none
              font-mono
              "
              >
                <div className="flex items-center space-x-2">
                  <img src="/docs/img/icons/javascript-icon.svg" className="w-4 h-4" />
                  <p className="text-scale-1200 text-sm group-hover:text-scale-1200 transition">
                    supabase-js
                  </p>
                </div>
              </div>
            </div>
            <Dropdown
              size="small"
              align="start"
              side="bottom"
              overlay={
                <>
                  <Dropdown.Label>Stable releases</Dropdown.Label>
                  <Dropdown.Item>
                    version 2.0
                    <Dropdown.RightSlot>
                      <Badge size="small">Latest</Badge>
                    </Dropdown.RightSlot>
                  </Dropdown.Item>
                  <Dropdown.Item>Version 1.0 </Dropdown.Item>
                  <Dropdown.Separator />
                  <Dropdown.Label>Alpha releases</Dropdown.Label>
                  <Dropdown.Misc>
                    <p className="text-scale-900 text-xs">Currently no alpha releases</p>
                  </Dropdown.Misc>
                </>
              }
            >
              <div className="w-32">
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
              border-scale-500 pl-3 pr-1.5 w-full h-[32px] rounded
              font-mono

              rounded-tl-none
              rounded-bl-none
              "
                >
                  <div className="flex items-center space-x-2">
                    <p className="text-scale-900 text-xs group-hover:text-scale-1200 transition">
                      version
                    </p>
                    <p className="text-scale-1200 text-sm group-hover:text-scale-1200 transition">
                      2.0
                    </p>
                  </div>
                </div>
              </div>
            </Dropdown>
          </div> */}

          <Dropdown
            size="small"
            align="start"
            side="bottom"
            overlay={
              <>
                <Dropdown.Label>Stable releases</Dropdown.Label>
                <Dropdown.Item>
                  version 2.0
                  <Dropdown.RightSlot>
                    <Badge size="small">Latest</Badge>
                  </Dropdown.RightSlot>
                </Dropdown.Item>
                <Dropdown.Item>Version 1.0 </Dropdown.Item>
                <Dropdown.Separator />
                <Dropdown.Label>Alpha releases</Dropdown.Label>
                <Dropdown.Misc>
                  <p className="text-scale-900 text-xs">Currently no alpha releases</p>
                </Dropdown.Misc>
              </>
            }
          >
            <div className="w-96">
              <div
                className="
              flex 
              gap-3
              group
              items-center 
              bg-scaleA-200 
              border 
              transition
              hover:border-scale-600
              hover:bg-scaleA-300 
              border-scale-500 pl-3 pr-1.5 w-full h-[32px] rounded
              font-mono
              "
              >
                <div className="flex items-center space-x-2">
                  <p className="text-scale-900 text-xs group-hover:text-scale-1200 transition">
                    Project
                  </p>
                  <div className="flex flex-row text-left gap-3">
                    <p className="text-scale-1200 text-sm group-hover:text-scale-1200 transition">
                      Meme.Town
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-scale-1100 text-[10px] group-hover:text-scale-1200 transition">
                    ref: an9q3p23dn32pdnc2n
                  </p>
                </div>
              </div>
            </div>
          </Dropdown>
        </div>
        <div className="grow flex items-center justify-end gap-3">
          <Button
            type="text"
            as="a"
            // @ts-ignore
            href="https://app.supabase.com"
            target="_blank"
            rel="noreferrer noopener"
          >
            Docs
          </Button>
          <Button type="text" icon={<IconMessageSquare />}>
            Feedback
          </Button>
          <Button
            type="text"
            as="a"
            // @ts-ignore
            href="https://app.supabase.com"
            target="_blank"
            rel="noreferrer noopener"
          >
            Dashboard
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
export default TopNavBarRef
