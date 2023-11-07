import { useTheme } from 'next-themes'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FC, useState } from 'react'
import { Button, IconCommand, IconGitHub, IconSearch, SearchButton } from 'ui'

import { getPageType } from '~/lib/helpers'
import { REFERENCES } from './NavigationMenu.constants'
import ThemeToggle from '@ui/components/ThemeProvider/ThemeToggle'

const TopNavBar: FC = () => {
  const { resolvedTheme } = useTheme()
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

  const pageLinks = [
    { text: 'Guides', key: 'docs', link: '/' },
    { text: 'Reference', key: 'reference', link: '/reference' },
  ]

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
    <nav className="h-[60px] border-b backdrop-blur backdrop-filter bg bg-opacity-75">
      <div className="px-5 max-w-7xl mx-auto flex gap-3 justify-between items-center h-full">
        <div className="lg:hidden">
          <Link href="/" className=" flex items-center gap-2">
            <Image
              className="cursor-pointer"
              src={
                resolvedTheme === 'dark' ? '/docs/supabase-dark.svg' : '/docs/supabase-light.svg'
              }
              width={96}
              height={24}
              alt="Supabase Logo"
            />
            <span className="font-mono text-sm font-medium text-brand">DOCS</span>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <SearchButton className="md:w-full lg:w-96 order-2 lg:order-1">
            <div
              className="
              flex
              group
              items-center
              justify-between
              bg-surface-100
              bg-opacity-75
              hover:bg-surface-200
              hover:bg-opacity-100
              border
              transition
              pl-1.5 md:pl-3 pr-1.5 w-full h-[32px] rounded
              text-foreground-lighter
              "
            >
              <div className="flex items-center space-x-2">
                <IconSearch className="" size={18} strokeWidth={2} />
                <p className="hidden md:flex text-sm">Search docs...</p>
              </div>
              <div className="hidden md:flex items-center space-x-1">
                <div className="md:flex items-center justify-center h-5 w-10 border rounded bg-surface-300 gap-1">
                  <IconCommand size={12} strokeWidth={1.5} />
                  <span className="text-[12px]">K</span>
                </div>
              </div>
            </div>
          </SearchButton>
        </div>
        <div className="hidden lg:flex grow items-center justify-end gap-3">
          <Button type="text" asChild>
            <a href="https://supabase.com" target="_blank" rel="noreferrer noopener">
              Supabase.com
            </a>
          </Button>
          <Button type="text" asChild>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer noopener">
              Dashboard
            </a>
          </Button>
          <Link
            href="https://github.com/supabase/supabase"
            target="_blank"
            rel="noreferrer noopener"
            className="px-2.5 py-1"
          >
            <IconGitHub
              size={16}
              className="text-foreground-light hover:text-foreground transition"
            />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
export default TopNavBar
