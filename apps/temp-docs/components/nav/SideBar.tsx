import { Menu } from 'ui'
import { Fragment } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

const SideBar = ({ menuItems }: { menuItems: any }) => {
  const { asPath } = useRouter()
  return (
    <div
      className="
        dark:bg-scale-200
        dark:border-scale-400
        sidebar-width
        sticky
        top-0
        flex
        h-screen
        overflow-y-scroll
        border-r
        py-10
        px-6"
    >
      <Menu className="w-full flex-col gap-12" type="pills">
        {Object.keys(menuItems).map((key) => {
          return (
            <div className="mb-8" key={key}>
              <Menu.Group title={key} />
              {menuItems[key].map((item: { link: string; text: string; sections: Array<any> }) => {
                return Array.isArray(item.sections) ? (
                  <Fragment key={item.text}>
                    <Menu.Group title={item.text} />
                    {item.sections.map((section) => (
                      <Link href={section.link} key={`${item.text}-${section.text}`}>
                        <a>
                          <Menu.Item active={asPath == section.link}>{section.text}</Menu.Item>
                        </a>
                      </Link>
                    ))}
                  </Fragment>
                ) : (
                  <Link href={item.link} key={item.text}>
                    <a>
                      <Menu.Item active={asPath === item.link}>
                        {/* <div
                        // className={asPath === item.link ? 'text-brand-900' : 'text-scale-1000'}
                        > */}
                        {item.text}
                        {/* </div> */}
                      </Menu.Item>
                    </a>
                  </Link>
                )
              })}
            </div>
          )
        })}
      </Menu>
    </div>
  )
}

export default SideBar
