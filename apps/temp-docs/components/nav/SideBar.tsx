import Link from 'next/link'
import { useRouter } from 'next/router'

const SideBar = ({ menuItems }: { menuItems: any }) => {
  console.log(Object.keys(menuItems))

  const { asPath } = useRouter()
  console.log('asPath -> ', asPath)

  function handleParentMenuToggle(e) {
    const toggleButton = e.target
    const sidebarMenu = document.querySelector('.sidebar-menu-container')

    // Close all parent menus
    const parentMenus = sidebarMenu.querySelectorAll('.parent-menu')
    parentMenus.forEach((menu) => menu.classList.add('hidden'))

    // Open the parent menu that's just been clicked
    const closestGroup = toggleButton.closest('.parent-menu-container')
    const subMenu = closestGroup.querySelector('.parent-menu')
    subMenu.classList.contains('hidden')
      ? subMenu.classList.remove('hidden')
      : subMenu.classList.add('hidden')
  }

  function handleSubMenuToggle(e) {
    const toggleButton = e.target
    const closestGroup = toggleButton.closest('.menu-group')
    const subMenu = closestGroup.querySelector('.sub-menu')
    subMenu.classList.contains('hidden')
      ? subMenu.classList.remove('hidden')
      : subMenu.classList.add('hidden')
  }

  const isMenuActive = (key) => {
    // check if main items have .some()
    if (menuItems[key].some((item) => item.link === asPath)) {
      return true
    }

    // check if sub items (sections) have .some()
    if (menuItems[key].some((item) => item.sections?.length > 0)) {
      if (
        menuItems[key].some((item) => item.sections?.some((section) => section.link === asPath))
      ) {
        return true
      }
    }

    return false
  }

  return (
    <div
      className="dark:bg-scale-200 dark:border-scale-400 sidebar-width sticky top-0 flex
        h-screen overflow-y-scroll border-r py-10 px-6 sidebar-menu-container"
    >
      <ul className="w-full flex-col gap-12 mb-8">
        {Object.keys(menuItems).map((key, i) => (
          <li key={key} className="mb-8 bg-gray-200 parent-menu-container">
            <button onClick={(e) => handleParentMenuToggle(e)} className="uppercase bg-gray-500">
              {key}
            </button>
            <ul className={['parent-menu', isMenuActive(key) ? '' : 'hidden'].join(' ')}>
              {menuItems[key].map((item) =>
                Array.isArray(item.sections) ? (
                  <div className="menu-group ml-4">
                    <button
                      onClick={(e) => handleSubMenuToggle(e)}
                      className="uppercase bg-gray-500"
                    >
                      {item.text}
                    </button>
                    <ul
                      className={['bg-gray-300 sub-menu', isMenuActive(key) ? '' : 'hidden'].join(
                        ' '
                      )}
                    >
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
                        <a className={item.link === asPath ? 'text-brand-800' : 'not'}>
                          {item.text}
                        </a>
                      </Link>
                    </li>
                  </p>
                )
              )}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SideBar
