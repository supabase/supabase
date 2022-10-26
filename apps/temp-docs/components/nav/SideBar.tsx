import Link from 'next/link'
import { useRouter } from 'next/router'
import { IconChevronRight } from '~/../../packages/ui'
import { NavMenuGroup, NavMenuSection } from './Nav.constants'
import * as Accordion from '@radix-ui/react-accordion'

const SideBar = ({ menuItems = [] }: { menuItems: any }) => {
  const { asPath } = useRouter()

  const currentSection: NavMenuGroup = menuItems.find((group) => {
    const foundItem = group.items.find((section) => {
      if (section.items.length > 0) {
        const foundSubItem = section.items.find((item) => {
          if (item.url === asPath) return item
        })
        if (foundSubItem) return section
      } else {
        if (section.url === asPath) return section
      }
    })
    if (foundItem) return group
  })

  const currentSubSection: NavMenuSection =
    currentSection !== undefined
      ? currentSection.items.find((section) => {
          if (section.items.length === 0) {
            return undefined
          } else {
            return section.items.find((item) => {
              if (item.url === asPath) return item
            })
          }
        })
      : undefined

  return (
    <div
      className="dark:bg-scale-200 dark:border-scale-400 sidebar-width sticky top-0 flex
      h-screen overflow-y-scroll border-r py-8 px-6 sidebar-menu-container"
    >
      <Accordion.Root
        collapsible
        type="single"
        defaultValue={currentSection?.label}
        className="w-full space-y-0.5"
      >
        {menuItems.map((group: NavMenuGroup) => (
          <Accordion.Item key={group.label} value={group.label}>
            <Accordion.Trigger className="w-full flex items-center space-x-2 py-1.5">
              <IconChevronRight
                className="transition text-scale-1000 data-open-parent:rotate-90"
                size={14}
                strokeWidth={2}
              />
              <span className="text-scale-1200 text-sm group-hover:text-brand-900 transition">
                {group.label}
              </span>
            </Accordion.Trigger>
            <Accordion.Content className="transition my-2 data-open:animate-slide-down data-closed:animate-slide-up">
              {group.items.map((section: NavMenuSection) => {
                if (section.items.length === 0) {
                  return (
                    <Link href={section.url}>
                      <a>
                        <div
                          key={section.name}
                          className={[
                            'py-1.5 px-5 rounded text-sm transition',
                            `${
                              section.url === asPath
                                ? 'bg-scale-400 text-brand-900'
                                : 'text-scale-1100 hover:text-scale-1200'
                            }`,
                          ].join(' ')}
                        >
                          {section.name}
                        </div>
                      </a>
                    </Link>
                  )
                } else {
                  return (
                    <Accordion.Root
                      collapsible
                      key={section.name}
                      type="single"
                      className="space-y-0.5"
                      defaultValue={currentSubSection?.name}
                    >
                      <Accordion.Item value={section.name}>
                        <Accordion.Trigger className="flex items-center space-x-2 px-4 py-1.5">
                          <IconChevronRight
                            className="transition text-scale-1000 data-open-parent:rotate-90"
                            size={14}
                            strokeWidth={2}
                          />
                          <span className="text-scale-1200 text-sm group-hover:text-brand-900 transition">
                            {section.name}
                          </span>
                        </Accordion.Trigger>
                        <Accordion.Content className="my-2 data-open:animate-slide-down data-closed:animate-slide-up">
                          {section.items.map((item: NavMenuSection) => (
                            <Link href={item.url}>
                              <a>
                                <div
                                  key={item.name}
                                  className={[
                                    'py-1.5 ml-4 px-5 rounded text-sm transition',
                                    `${
                                      item.url === asPath
                                        ? 'bg-scale-400 text-brand-900'
                                        : 'text-scale-1100 hover:text-scale-1200'
                                    }`,
                                  ].join(' ')}
                                >
                                  {item.name}
                                </div>
                              </a>
                            </Link>
                          ))}
                        </Accordion.Content>
                      </Accordion.Item>
                    </Accordion.Root>
                  )
                }
              })}
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  )
}

export default SideBar
