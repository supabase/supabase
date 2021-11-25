import { useState, useEffect } from 'react'
import {
  IconMenu,
  Typography,
  IconGitHub,
  IconTwitter,
  IconSearch,
  Input,
  IconCommand,
  Button,
} from '@supabase/ui'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import styles from '../../styles/Home.module.css'
const NavBar = () => {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  return (
    <nav
      className={`${styles.navbar} flex justify-between top-0 sticky border-b dark:border-gray-600 p-4`}
    >
      <div className="flex items-center">
        <button className="block lg:hidden mr-2">
          <IconMenu />
        </button>
        {mounted && (
          <Image
            src={resolvedTheme === 'dark' ? `/supabase-dark.svg` : `/supabase-light.svg`}
            width={200}
            height={32}
            alt="Supabase Logo"
          />
        )}
        <ul className={`${styles.navLinks} flex`}>
          <li>
            <Typography.Link>Overview</Typography.Link>
          </li>
          <li>
            <Typography.Link>Guides</Typography.Link>
          </li>
          <li>
            <Typography.Link>Reference</Typography.Link>
          </li>
          <li>
            <Typography.Link>Login</Typography.Link>
          </li>
        </ul>
      </div>
      <div className={`${styles.navRight} flex items-center`}>
        <Typography.Link href="https://github.com/supabase/supabase">
          <IconGitHub />
        </Typography.Link>
        <Typography.Link href="https://twitter.com/supabase">
          <IconTwitter />
        </Typography.Link>
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
