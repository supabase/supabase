import { Menu } from '@supabase/ui'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../../styles/Home.module.css'
import ThemeToggle from '../ThemeToggle'
import menuItems from './menu-items.json'

const SideBar = () => {
  const { asPath } = useRouter()
  return (
    <div className={`${styles.sidebar} fixed relative h-full py-4 border-r dark:border-dark`}>
      <Menu>
        <div>
          {Object.keys(menuItems).map((key) => {
            return (
              <div key={key} className="mb-4">
                <Menu.Group title={key} />
                {menuItems[key].map((item: { link: string; text: string }) => (
                  <span key={item.link}>
                    <Link href={item.link} passHref>
                      <a>
                        <Menu.Item
                          active={asPath === item.link}
                          showActiveBar={asPath === item.link}
                        >
                          {item.text}
                        </Menu.Item>
                      </a>
                    </Link>
                  </span>
                ))}
              </div>
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
