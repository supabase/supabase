import Image from 'next/legacy/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { REFERENCES } from '~/content/navigation.references'

import * as Accordion from '@radix-ui/react-accordion'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { NavMenuGroup, NavMenuSection } from './Navigation.types'

const SideBar = ({ menuItems = [] }: { menuItems: NavMenuGroup[] }) => {
  const pathname = usePathname()
  const pathSegments = pathname.split('/')

  const isInReferencePages = pathSegments.includes('reference') && pathSegments.length >= 3
  const referenceMeta = pathSegments.length >= 3 ? REFERENCES[pathSegments[2]] : undefined

  const currentSection: NavMenuGroup | undefined = menuItems.find((group) => {
    const foundItem = group.items.find((section) => {
      if (section.items.length > 0) {
        const foundSubItem = section.items.find((item) => {
          return item.url === pathname
        })
        return !!foundSubItem
      } else {
        return section.url === pathname
      }
    })
    return !!foundItem
  })

  const currentSubSection: NavMenuSection | undefined =
    currentSection !== undefined
      ? currentSection.items.find((section) => {
          if (section.items.length === 0) {
            return undefined
          } else {
            return section.items.find((item) => item.url === pathname)
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
              <ArrowLeft size={16} strokeWidth={2} className="text-foreground" />
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
            typeof item.url === 'string' ? (
              <Link key={item.name} href={item.url}>
                <div
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
            ) : null
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
                <ChevronRight
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
                      <div key={section.name}>
                        {typeof section.url === 'string' && (
                          <Link href={section.url}>
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
                        )}
                      </div>
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
                            <ChevronRight
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
                              <div key={item.name}>
                                {typeof item.url === 'string' && (
                                  <Link href={item.url}>
                                    <div
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
                                )}
                              </div>
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
