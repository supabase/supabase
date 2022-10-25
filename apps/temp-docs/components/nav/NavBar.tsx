import { useState, useEffect } from 'react'
import { IconMenu, IconGitHub, IconTwitter, IconSearch, Input, IconCommand, Button } from 'ui'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '../Providers'

const NavBar = ({ currentPage }: { currentPage: string }) => {
  const { isDarkMode } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [isDarkMode])

  const pageLinks = [
    { text: 'Guides', link: '/guides' },
    {
      text: 'Reference',
      link: '/reference',
    },
  ]

  return (
    <nav className="dark:border-scale-400 dark:bg-scale-200 sticky top-0 z-10 flex h-[72px] items-center justify-between border-b bg-white p-4 backdrop-blur backdrop-filter font-semibold">
      <div className="flex items-center">
        <button className="mr-4 block stroke-2 lg:hidden">
          <IconMenu className="text-scale-1100" />
        </button>
        {mounted && (
          <Link href="/">
            <a className="flex items-center">
              <Image
                className="cursor-pointer"
                src={isDarkMode ? `/supabase-dark.svg` : `/supabase-light.svg`}
                width={200}
                height={32}
                alt="Supabase Logo"
              />
            </a>
          </Link>
        )}
        <nav className="ml-24 hidden space-x-8 lg:flex">
          <ul className="hidden space-x-8 lg:flex">
            {pageLinks.map((p) => (
              <li key={`${p.text}-${p.link}`}>
                <Link href={p.link}>
                  <a
                    className={`text-sm ${
                      currentPage === p.text ? 'text-brand-900' : 'text-scale-1100'
                    }`}
                  >
                    {p.text}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="flex items-center space-x-6">
        <div className="hidden items-center space-x-6 md:flex">
          <ul className="flex items-center gap-4">
            <li>
              <a
                href="https://app.supabase.com"
                className="text-scale-1100 text-sm font-semibold"
                target="_blank"
                rel="noreferrer noopener"
              >
                Dashboard
              </a>
            </li>
            <li>
              <a
                href="https://github.com/supabase/supabase"
                target="_blank"
                rel="noreferrer noopener"
              >
                <IconGitHub className="text-scale-1100 stroke-2" />
              </a>
            </li>
            <li>
              <a
                href="https://discord.supabase.com"
                rel="noreferrer noopener"
                target="_blank"
                className="text-scale-1100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m8 17-.55 2C5.5 18.5 3.5 17.5 2 16.27 2 11 3.5 7.5 5 5c0 0 2.5-1 4.5-1l.5 1.36a4.82 4.82 0 0 1 4 .14l.5-1.5c2 0 4.5 1 4.5 1 1.5 2.5 3 6 3 11.27A14.68 14.68 0 0 1 16.55 19L16 17" />
                  <path d="M7.5 16.5c.73.5 2 1.5 4.5 1.5s3.77-1 4.5-1.5" />
                  <circle cx="9" cy="12" r="1" />
                  <circle cx="15" cy="12" r="1" />
                </svg>
              </a>
            </li>

            <a href="https://twitter.com/supabase" target="_blank" rel="noreferrer noopener">
              <IconTwitter className="text-scale-1100 stroke-2" />
            </a>
          </ul>
        </div>
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
