import { Menu } from '@supabase/ui'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../../styles/Home.module.css'
import ThemeToggle from '../ThemeToggle'
import menuItems from './menu-items.json'

const SideBar = () => {
  const { pathname } = useRouter()
  return (
    <div className={`${styles.sidebar} fixed relative h-full`}>
      <Menu className={`border-r dark:border-gray-600`}>
        <div>
          {Object.keys(menuItems).map((key) => {
            return (
              <span key={key}>
                <Menu.Group title={key} />
                {menuItems[key].map((item) => (
                  <span key={item.link}>
                    <Link href={item.link} passHref>
                      <a>
                        <Menu.Item
                          active={pathname === item.link}
                          showActiveBar={pathname === item.link}
                        >
                          {item.text}
                        </Menu.Item>
                      </a>
                    </Link>
                  </span>
                ))}
              </span>
            )
          })}
        </div>
        <div className="mt-16 w-full">
          <Menu.Item>
            <ThemeToggle />
          </Menu.Item>
        </div>
      </Menu>
    </div>
  )
}

export default SideBar
