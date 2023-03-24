import { useRouter } from 'next/router'
import * as React from 'react'

import { useCommandState } from 'cmdk-supabase'
import { CreditCard, Settings, User } from 'lucide-react'
import { IconBook } from '../Icon/icons/IconBook'
import { IconCopy } from '../Icon/icons/IconCopy'
import { IconInbox } from '../Icon/icons/IconInbox'
import { IconMonitor } from '../Icon/icons/IconMonitor'
import AiCommand from './AiCommand'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandLabel,
  CommandList,
  CommandShortcut,
} from './Command.utils'
import { useCommandMenu } from './CommandMenuProvider'
// import { SearchProvider } from './SearchProvider'
import navItems from './command-nav-items.json'
import { NavItem } from './Command.types'
import { AiIcon } from './Command.icons'
import { IconArrowRight } from '../Icon/icons/IconArrowRight'
import { IconLifeBuoy } from '../Icon/icons/IconLifeBuoy'
import DocsSearch from './DocsSearch'

export const COMMAND_ROUTES = {
  AI: 'Supabase AI',
  DOCS_SEARCH: 'Docs Search',
  THEME: 'Theme',
}

interface IActions {
  toggleTheme: () => void
}

const iconPicker = {
  arrowRight: <IconArrowRight />,
  book: <IconBook />,
  inbox: <IconInbox />,
}

const SearchOnlyItem = ({ children, isSubItem, ...props }: any) => {
  const search = useCommandState((state) => state.search)
  // if search is empty & items is marked as a subItem, don't show it
  // ie: only show these items in search results, not top level
  if (!search && isSubItem) return null
  return <CommandItem {...props}>{children}</CommandItem>
}

const CommandMenu = () => {
  const [search, setSearch] = React.useState('')
  const [pages, setPages] = React.useState([])
  const page = pages[pages.length - 1]
  const router = useRouter()
  const { isOpen, setIsOpen, actions } = useCommandMenu()

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

  function handleSetPages(pages: any, keepSearch: any) {
    setPages(pages)
    if (!keepSearch) setSearch('')
  }

  const showCommandInput = page === undefined

  return (
    <>
      <CommandDialog
        page={page}
        visible={isOpen}
        onOpenChange={setIsOpen}
        onCancel={() => setIsOpen(!open)}
        size={'xlarge'}
        className={'max-h-[70vh] lg:max-h-[50vh] overflow-hidden overflow-y-auto'}
        onKeyDown={(e) => {
          // Escape goes to previous page
          // Backspace goes to previous page when search is empty
          if (
            e.key === 'Escape'
            // || (e.key === 'Backspace' && !search)
          ) {
            e.preventDefault()
            if (!page) setIsOpen(false)
            setSearch('')
            setPages((pages) => pages.slice(0, -1))
          }
        }}
      >
        {pages.length > 0 && (
          <div className="flex w-full gap-2 px-4 pt-4 justify-items-start flex-row">
            <CommandShortcut onClick={() => setPages([])}>{'Home'}</CommandShortcut>
            {pages.map((page, index) => (
              <CommandShortcut
                key={page}
                onClick={() => {
                  if (index === pages.length - 1) {
                    return
                  }
                  setPages((pages) => pages.slice(0, index - 1))
                }}
              >
                {page}
              </CommandShortcut>
            ))}
          </div>
        )}
        {showCommandInput && (
          <CommandInput
            placeholder="Type a command or search..."
            value={search}
            onValueChange={setSearch}
          />
        )}
        <CommandList className={['my-2', showCommandInput && 'max-h-[300px]'].join(' ')}>
          {!page && (
            <>
              <CommandGroup heading="Documentation" forceMount>
                <CommandItem
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
                  <CommandItem onSelect={() => router.push(item.url)}>
                    <IconArrowRight className="text-scale-900" />
                    <CommandLabel>
                      Go to <span className="font-bold"> {item.label}</span>
                    </CommandLabel>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandGroup heading="Support">
                {navItems.docsSupport.map((item) => (
                  <CommandItem onSelect={() => router.push(item.url)}>
                    <IconLifeBuoy className="text-scale-900" />
                    <CommandLabel>
                      Go to <span className="font-bold"> {item.label}</span>
                    </CommandLabel>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandGroup heading="General">
                {navItems.docsGeneral.map((item) => (
                  <CommandItem onSelect={() => router.push(item.url)}>
                    {item.icon && iconPicker[item.icon]}
                    <CommandLabel>{item.label}</CommandLabel>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandGroup heading="Settings">
                <CommandItem onSelect={() => handleSetPages([...pages, 'Theme'], false)}>
                  <IconMonitor className="mr-2" />
                  Change theme
                </CommandItem>
              </CommandGroup>
              <ThemeOptions isSubItem />
              <SearchableChildItems isSubItem />
            </>
          )}
          {page === COMMAND_ROUTES.AI && (
            <AiCommand query={search} setQuery={setSearch} page={page} />
          )}
          {page === COMMAND_ROUTES.DOCS_SEARCH && (
            <DocsSearch query={search} setQuery={setSearch} page={page} router={router} />
          )}
          {page === COMMAND_ROUTES.THEME && <ThemeOptions />}
        </CommandList>
      </CommandDialog>
    </>
  )
}

export default CommandMenu
