import { Menu } from '@supabase/ui'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../../styles/Home.module.css'
import ThemeToggle from '../ThemeToggle'

const SideBar = ({ menuItems }: { menuItems: any }) => {
  const { asPath } = useRouter()
  return (
    <div
      className={`${styles.sidebar} dark:bg-scale-200 dark:border-scale-400 relative h-full border-r py-4`}
    >
      <Menu>
        <div>
          {Object.keys(menuItems).map((key) => {
            return (
              <div key={key} className="mb-4">
                <Menu.Group title={key} />
                {menuItems[key].map((item: { link: string; text: string; sections: Array }) => (
                  <span key={item.link}>
                    {Array.isArray(item.sections) ? (
                      <>
                        <Menu.Group title={item.text} />
                        {item.sections.map((section) => (
                          <Link href={section.link} key={`${item.text}-${section.text}`}>
                            <Menu.Item
                              active={asPath == section.link}
                              showActiveBar={asPath === section.link}
                            >
                              {section.text}
                            </Menu.Item>
                          </Link>
                        ))}
                      </>
                    ) : (
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
                    )}
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
