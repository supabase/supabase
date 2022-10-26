import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { IconChevronRight } from '~/../../packages/ui'

const SideBar = ({ menuItems: passedMenuItems }: { menuItems: any }) => {
  const [menuItems, setMenuItems] = useState(passedMenuItems)
  console.log('sidebar', menuItems)

  const { asPath } = useRouter()

  function toggleMenuItem(label: string) {
    const newMenuItems = menuItems.map((item: any) => {
      // see if the item has grandchildren

      // collapse all first
      item.collapsed = true

      // then grab the one that matches the label and invert it
      if (item.label === label) {
        return { ...item, collapsed: !item.collapsed }
      }

      return item
    })
    setMenuItems(newMenuItems)
  }

  return (
    <div
      className="dark:bg-scale-200 dark:border-scale-400 sidebar-width sticky top-0 flex
        h-screen overflow-y-scroll border-r py-10 px-6 sidebar-menu-container"
    >
      <ul className="w-full flex-col gap-12 mb-8">
        {menuItems.map((item) => (
          <li className="mt-1">
            <button onClick={(e) => toggleMenuItem(item.label)} className="flex items-center">
              <IconChevronRight /> {item.label}
            </button>
            <ul className={`mb-8 ml-5 text-sm ${item.collapsed ? 'hidden' : ''}`}>
              {item.items.map((child) => (
                <li>
                  {child.items ? (
                    <div>
                      <button
                        className="flex items-center"
                        onClick={(e) => toggleMenuItem(child.label)}
                      >
                        <IconChevronRight />
                        {child.label}
                      </button>
                      <ul className={`mb-4 mt-2 ml-2 ${child.collapsed ? 'hidden' : ''}`}>
                        {child.items.map((grandchild) => (
                          <li>{grandchild}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    child
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
        {/* {Object.keys(menuItems).map((key, i) => (
          <li key={key} className="mb-8 bg-gray-200 parent-menu-container">
            <button
              onClick={(e) => console.log('hay ')}
              className={[
                'parent-menu-toggle text-sm bg-gray-500 flex items-center gap-1',
                2 > 1 ? 'active' : '',
              ].join(' ')}
            >
              <IconChevronRight size="tiny" strokeWidth="0.75" />
              {key}
            </button>
            <ul className={['parent-menu mt-4', 2 > 1 ? '' : 'hidden'].join(' ')}>
              {menuItems[key].map((item) =>
                Array.isArray(item.sections) ? (
                  <div className="sub-menu-group ml-4">
                    <button
                      onClick={(e) => console.log()}
                      className="parent-menu-toggle text-sm bg-gray-500 flex items-center gap-1"
                    >
                      <IconChevronRight size="tiny" strokeWidth="0.75" />
                      {item.text}
                    </button>
                    <ul className={['bg-gray-300 sub-menu ml-5', 2 > 1 ? 'hidden' : ''].join(' ')}>
                      {item.sections.map((menuItem) => (
                        <li>
                          <Link href={menuItem.link}>
                            <a className={menuItem.link === asPath ? 'text-brand-800' : ''}>
                              {menuItem.text}
                            </a>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p>
                    <li>
                      <Link href={item.link}>
                        <a className={item.link === asPath ? 'text-brand-800' : ''}>{item.text}</a>
                      </Link>
                    </li>
                  </p>
                )
              )}
            </ul>
          </li>
        ))} */}
      </ul>
    </div>
  )
}

export default SideBar
