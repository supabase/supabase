import { useState, useEffect } from 'react'
import {
  IconMenu,
  IconGitHub,
  IconTwitter,
  IconSearch,
  Input,
  IconCommand,
  Button,
} from '@supabase/ui'
import Image from 'next/image'
import Link from 'next/link'
import styles from '../../styles/Home.module.css'
import { useTheme } from '../Providers'

const NavBar = ({ currentPage }: { currentPage: string }) => {
  const [mounted, setMounted] = useState(false)
  const { isDarkMode } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [isDarkMode])

  const pageLinks = [
    { text: 'Overview', active: currentPage == 'Docs', link: '/' },
    { text: 'Guides', active: currentPage == 'Guides', link: '/guides' },
    {
      text: 'Reference',
      active: currentPage == 'Reference',
      link: '/reference/javascript/supabase-client',
    },
  ]

  return (
    <nav
      className={`dark:border-dark sticky top-0 z-10 flex h-[72px] justify-between border-b bg-white p-4 backdrop-blur backdrop-filter dark:bg-gray-800`}
    >
      <div className="flex items-center">
        <button className="mr-2 block lg:hidden">
          <IconMenu />
        </button>
        {mounted && (
          <Link href="/">
            <a>
              <Image
                className="cursor-pointer"
                src={isDarkMode ? `/docs/supabase-dark.svg` : `/docs/supabase-light.svg`}
                width={200}
                height={32}
                alt="Supabase Logo"
              />
            </a>
          </Link>
        )}

        <ul className={`${styles.navLinks} flex`}>
          {pageLinks.map((p) => (
            <li key={`${p.text}-${p.link}`}>
              <Link href={p.link}>
                <a
                  className={`${p.active ? 'text-gray-800 dark:text-gray-200' : 'text-brand-600'}`}
                >
                  {p.text}
                </a>
              </Link>
            </li>
          ))}
          <li>
            <Link href="https://app.supabase.io">
              <a className={`text-brand-600`}>Login</a>
            </Link>
          </li>
        </ul>
      </div>
      <div className={`${styles.navRight} flex items-center`}>
        <Link href="https://github.com/supabase/supabase">
          <a>
            <IconGitHub className="text-brand-600" />
          </a>
        </Link>
        <Link href="https://twitter.com/supabase">
          <a>
            <IconTwitter className="text-brand-600" />
          </a>
        </Link>
        <Input
          placeholder="Search"
          icon={<IconSearch />}
          type="search"
          actions={[
            <Button disabled key="icon-command" type="default" size="tiny">
              <IconCommand size="tiny" />
            </Button>,
            <Button disabled key="icon-letter" type="default" size="tiny">
              K
            </Button>,
          ]}
        />
      </div>
    </nav>
  )
}
export default NavBar
