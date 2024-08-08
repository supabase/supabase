import Link from 'next/link'
import Image from 'next/legacy/image'
import { usePathname } from 'next/navigation'
import { IconChevronRight, IconArrowLeft } from '~/../../packages/ui'
import { REFERENCES } from '~/content/navigation.references'

import { NavMenuGroup, NavMenuSection } from './Navigation.types'
import * as Accordion from '@radix-ui/react-accordion'

const SideBar = ({ menuItems = [] }: { menuItems: any }) => {
  const pathname = usePathname()
  const pathSegments = pathname.split('/')

  const isInReferencePages = pathSegments.includes('reference') && pathSegments.length >= 3
  const referenceMeta = pathSegments.length >= 3 ? REFERENCES[pathSegments[2]] : undefined

  const currentSection: NavMenuGroup = menuItems.find((group) => {
    const foundItem = group.items.find((section) => {
      if (section.items.length > 0) {
        const foundSubItem = section.items.find((item) => {
          if (item.url === pathname) return item
        })
        if (foundSubItem) return section
      } else {
        if (section.url === pathname) return section
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
              if (item.url === pathname) return item
            })
          }
        })
      : undefined

  return (
    <div
      className="bg-background border-muted sidebar-width sticky top-44
      h-screen overflow-y-scroll border-r py-8 px-6 sidebar-menu-container hidden lg:block"
    >
      {isInReferencePages && (
        <>
          <Link href="/reference">
            <div className="flex items-center space-x-4 opacity-75 hover:opacity-100 transition">
              <IconArrowLeft size={16} strokeWidth={2} className="text-foreground" />
              <span className="text-sm text-foreground">All Reference Docs</span>
            </div>
          </Link>
          {referenceMeta !== undefined && (
            <div className="my-5 flex items-center space-x-4">
              <div className="h-10 w-10 rounded bg-surface-100 flex items-center justify-center">
                <Image
                  className="rounded"
                  width={24}
                  height={24}
                  alt={referenceMeta.name}
                  src={referenceMeta.icon}
                />
              </div>
              <p className="text-foreground font-bold">{referenceMeta.name}</p>
            </div>
          )}
        </>
      )}
      {menuItems.length === 1 ? (
        <div className="my-2">
          {menuItems[0].items.map((item) => (
            <Link key={item.name} href={item.url}>
              <div
                key={item.name}
                className={[
                  'py-1.5 px-5 rounded text-sm transition',
                  `${
                    item.url === pathname
                      ? 'bg-background text-brand-link'
                      : 'text-foreground-light hover:text-foreground'
                  }`,
                ].join(' ')}
              >
                {item.name}
              </div>
            </Link>
          ))}
        </div>
      ) : (
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
                  className="transition text-foreground-lighter data-open-parent:rotate-90"
                  size={14}
                  strokeWidth={2}
                />
                <span className="text-foreground text-sm group-hover:text-brand transition">
                  {group.label}
                </span>
              </Accordion.Trigger>
              <Accordion.Content className="transition my-2 data-open:animate-slide-down data-closed:animate-slide-up">
                {group.items.map((section: NavMenuSection) => {
                  if (section.items.length === 0) {
                    return (
                      <Link href={section.url} key={section.name}>
                        <div
                          className={[
                            'py-1.5 px-5 rounded text-sm transition',
                            `${
                              section.url === pathname
                                ? 'bg-background text-brand'
                                : 'text-foreground-light hover:text-foreground'
                            }`,
                          ].join(' ')}
                        >
                          {section.name}
                        </div>
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
                              className="transition text-foreground-lighter data-open-parent:rotate-90"
                              size={14}
                              strokeWidth={2}
                            />
                            <span className="text-foreground text-sm group-hover:text-brand transition">
                              {section.name}
                            </span>
                          </Accordion.Trigger>
                          <Accordion.Content className="my-2 data-open:animate-slide-down data-closed:animate-slide-up">
                            {section.items.map((item: NavMenuSection) => (
                              <Link key={item.name} href={item.url}>
                                <div
                                  key={item.name}
                                  className={[
                                    'py-1.5 ml-4 px-5 rounded text-sm transition',
                                    `${
                                      item.url === pathname
                                        ? 'bg-background text-brand'
                                        : 'text-foreground-light hover:text-foreground'
                                    }`,
                                  ].join(' ')}
                                >
                                  {item.name}
                                </div>
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
      )}
    </div>
  )
}

export default SideBar
