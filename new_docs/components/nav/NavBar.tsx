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
const NavBar = ({ currentPage }: { currentPage: string }) => {
  const [mounted, setMounted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return (
      typeof window !== 'undefined' && window.localStorage.getItem('supabaseDarkMode') == 'true'
    )
  })

  useEffect(() => {
    setIsDarkMode(localStorage.getItem('supabaseDarkMode') === 'true')
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
      className={`flex justify-between border-b dark:border-dark p-4 sticky top-0 z-10 bg-opacity-50 h-[72px] bg-white dark:bg-gray-800 backdrop-filter backdrop-blur  firefox:bg-opacity-90`}
    >
      <div className="flex items-center">
        <button className="block lg:hidden mr-2">
          <IconMenu />
        </button>
        {mounted && (
          <Link href="/">
            <a>
              <Image
                className="cursor-pointer"
                src={isDarkMode ? `/docs/supabase-light.svg` : `/docs/supabase-dark.svg`}
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
                  className={`${p.active ? 'text-gray-800 dark:text-gray-200' : 'text-green-400'}`}
                >
                  {p.text}
                </a>
              </Link>
            </li>
          ))}
          <li>
            <Link href="https://app.supabase.io">
              <a className={`text-green-400`}>Login</a>
            </Link>
          </li>
        </ul>
      </div>
      <div className={`${styles.navRight} flex items-center`}>
        <Link href="https://github.com/supabase/supabase">
          <a>
            <IconGitHub className="text-green-400" />
          </a>
        </Link>
        <Link href="https://twitter.com/supabase">
          <a>
            <IconTwitter className="text-green-400" />
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
