import { Menu } from '@supabase/ui'
import Link from 'next/link'
import { useRouter } from 'next/router'

const SideBar = ({ menuItems }: { menuItems: any }) => {
  const { asPath } = useRouter()
  return (
    <div className="dark:bg-scale-200 dark:border-scale-400 thin-scrollbar sidebar-width sticky top-0 flex h-screen overflow-y-scroll border-r py-4">
      <Menu className="w-full">
        <div>
          {Object.keys(menuItems).map((key) => {
            return (
              <div key={key} className="mb-4">
                <Menu.Group title={key} />
                {menuItems[key].map(
                  (item: { link: string; text: string; sections: Array<any> }) => (
                    <span key={item.link}>
                      {Array.isArray(item.sections) ? (
                        <>
                          <Menu.Group title={item.text} />
                          {item.sections.map((section) => (
                            <Link href={section.link} key={`${item.text}-${section.text}`}>
                              <a>
                                <Menu.Item active={asPath == section.link}>
                                  {section.text}
                                </Menu.Item>
                              </a>
                            </Link>
                          ))}
                        </>
                      ) : (
                        <Link href={item.link}>
                          <a>
                            <Menu.Item active={asPath === item.link}>
                              <div
                                className={
                                  asPath === item.link ? 'text-brand-900' : 'text-scale-1000'
                                }
                              >
                                {item.text}
                              </div>
                            </Menu.Item>
                          </a>
                        </Link>
                      )}
                    </span>
                  )
                )}
              </div>
            )
          })}
        </div>
      </Menu>
    </div>
  )
}

export default SideBar
