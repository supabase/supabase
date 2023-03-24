import { useCommandState } from 'cmdk-supabase'
import { useRouter } from 'next/router'
import * as React from 'react'
import { ElementRef, useRef } from 'react'
import { IconHome } from '../Icon/icons/IconHome'

import { IconArrowRight } from './../Icon/icons/IconArrowRight'
import { IconBook } from './../Icon/icons/IconBook'
import { IconColumns } from './../Icon/icons/IconColumns'
import { IconInbox } from './../Icon/icons/IconInbox'
import { IconLifeBuoy } from './../Icon/icons/IconLifeBuoy'
import { IconMonitor } from './../Icon/icons/IconMonitor'
import { IconPhone } from './../Icon/icons/IconPhone'
import { IconUser } from './../Icon/icons/IconUser'

import AiCommand from './AiCommand'
import navItems from './command-nav-items.json'
import { AiIcon } from './Command.icons'
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandLabel,
  CommandList,
  CommandShortcut,
} from './Command.utils'
import { useCommandMenu } from './CommandMenuProvider'
import DocsSearch from './DocsSearch'

export const COMMAND_ROUTES = {
  AI: 'Supabase AI',
  DOCS_SEARCH: 'Docs Search',
  THEME: 'Theme',
  AI_ASK_ANYTHING: 'Ask anything',
  AI_RLS_POLICY: 'Help me create a RLS policy',
}

export const CHAT_ROUTES = [
  COMMAND_ROUTES.AI, // this one is temporary
  COMMAND_ROUTES.AI_ASK_ANYTHING,
  COMMAND_ROUTES.AI_RLS_POLICY,
]

const iconPicker: { [key: string]: React.ReactNode } = {
  arrowRight: <IconArrowRight />,
  book: <IconBook />,
  inbox: <IconInbox />,
  mobile: <IconPhone />,
  person: <IconUser />,
  services: <IconColumns />,
  contact: <IconMonitor />,
  icon: <IconHome />,
  products: <IconColumns />,
}

const SearchOnlyItem = ({ children, isSubItem, ...props }: any) => {
  const search = useCommandState((state) => state.search)
  // if search is empty & items is marked as a subItem, don't show it
  // ie: only show these items in search results, not top level
  if (!search && isSubItem) return null
  return <CommandItem {...props}>{children}</CommandItem>
}

const CommandMenu = () => {
  const router = useRouter()
  const commandInputRef = useRef<ElementRef<typeof CommandInput>>()
  const { isOpen, setIsOpen, actions, search, setSearch, pages, setPages, currentPage } =
    useCommandMenu()

  const ThemeOptions = ({ isSubItem = false }) => {
    return (
      <CommandGroup>
        <SearchOnlyItem
          isSubItem={isSubItem}
          onSelect={() => {
            actions.toggleTheme(true)
            setIsOpen(false)
          }}
        >
          Change Theme to dark
        </SearchOnlyItem>
        <SearchOnlyItem
          isSubItem={isSubItem}
          onSelect={() => {
            actions.toggleTheme(false)
            setIsOpen(false)
          }}
        >
          Change Theme to light
        </SearchOnlyItem>
      </CommandGroup>
    )
  }

  const SearchableChildItems = ({ isSubItem = false }) => {
    return (
      <CommandGroup>
        {/* output only subItems  */}
        {navItems.items
          .filter((item) => item.sites.includes('docs'))
          .flatMap((item) => item.subItems)
          .map((item) => (
            <SearchOnlyItem
              key={item.url}
              icon={item.icon}
              isSubItem={isSubItem}
              onSelect={() => {
                console.log('hay')
              }}
            >
              {item.label}
            </SearchOnlyItem>
          ))}
      </CommandGroup>
    )
  }

  function handleSetPages(pages: string[], keepSearch?: boolean) {
    setPages(pages)
    if (!keepSearch) setSearch('')
    commandInputRef.current?.focus()
  }

  const showCommandInput = !CHAT_ROUTES.includes(currentPage)

  return (
    <>
      <CommandDialog
        page={currentPage}
        visible={isOpen}
        onInteractOutside={() => {
          setIsOpen(!open)
        }}
        size={'xlarge'}
        className={'max-h-[70vh] lg:max-h-[50vh] overflow-hidden overflow-y-auto'}
      >
        {pages.length > 0 && (
          <div className="flex w-full gap-2 px-4 pt-4 justify-items-start flex-row">
            <CommandShortcut onClick={() => handleSetPages([])}>{'Home'}</CommandShortcut>
            {pages.map((page, index) => (
              <CommandShortcut
                key={page}
                onClick={() => {
                  if (index === pages.length - 1) {
                    return
                  }
                  handleSetPages(pages.slice(0, index - 1))
                }}
              >
                {page}
              </CommandShortcut>
            ))}
          </div>
        )}
        {showCommandInput && (
          <CommandInput
            ref={commandInputRef}
            placeholder="Type a command or search..."
            value={search}
            onValueChange={setSearch}
          />
        )}
        <CommandList className={['my-2', showCommandInput && 'max-h-[300px]'].join(' ')}>
          {!currentPage && (
            <>
              <CommandGroup heading="Documentation" forceMount>
                <CommandItem
                  type="command"
                  onSelect={() => {
                    handleSetPages([...pages, COMMAND_ROUTES.AI], false)
                  }}
                  forceMount
                >
                  <AiIcon />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-900 to-purple-1100">
                    Ask Supabase AI
                    {search ? (
                      <>
                        {': '}
                        <span className="text-scale-1200 font-semibold">{search}</span>
                      </>
                    ) : (
                      '...'
                    )}
                  </span>
                </CommandItem>
                <CommandItem
                  type="command"
                  onSelect={() => handleSetPages([...pages, COMMAND_ROUTES.DOCS_SEARCH], true)}
                  forceMount
                >
                  <IconBook className="" />

                  <span>
                    Search the docs
                    {search ? (
                      <>
                        {': '}
                        <span className="text-scale-1200 font-semibold">{search}</span>
                      </>
                    ) : (
                      '...'
                    )}
                  </span>
                </CommandItem>
              </CommandGroup>

              <CommandGroup heading="Navigation">
                {navItems.docsTools.map((item) => (
                  <CommandItem key={item.url} type="link" onSelect={() => router.push(item.url)}>
                    <IconArrowRight className="text-scale-900" />
                    <CommandLabel>
                      Go to <span className="font-bold"> {item.label}</span>
                    </CommandLabel>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandGroup heading="Support">
                {navItems.docsSupport.map((item) => (
                  <CommandItem key={item.url} type="link" onSelect={() => router.push(item.url)}>
                    <IconLifeBuoy className="text-scale-900" />
                    <CommandLabel>
                      Go to <span className="font-bold"> {item.label}</span>
                    </CommandLabel>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandGroup heading="General">
                {navItems.docsGeneral.map((item) => (
                  <CommandItem key={item.url} type="link" onSelect={() => router.push(item.url)}>
                    {item?.icon && iconPicker[item.icon]}
                    <CommandLabel>{item.label}</CommandLabel>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandGroup heading="Settings">
                <CommandItem
                  type="link"
                  onSelect={() => handleSetPages([...pages, 'Theme'], false)}
                >
                  <IconMonitor className="mr-2" />
                  Change theme
                </CommandItem>
              </CommandGroup>
              <ThemeOptions isSubItem />
              <SearchableChildItems isSubItem />
            </>
          )}
          {currentPage === COMMAND_ROUTES.AI && <AiCommand />}
          {currentPage === COMMAND_ROUTES.DOCS_SEARCH && <DocsSearch />}
          {currentPage === COMMAND_ROUTES.THEME && <ThemeOptions />}
        </CommandList>
      </CommandDialog>
    </>
  )
}

export default CommandMenu
