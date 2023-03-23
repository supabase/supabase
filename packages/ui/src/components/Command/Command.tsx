import React from 'react'
import { useRouter } from 'next/router'

import { Calculator, Calendar, CreditCard, Settings, Smile, User } from 'lucide-react'
import { useCommandState } from 'cmdk-supabase'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemStale,
  CommandLabel,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './Command.utils'
import { IconCloudDrizzle } from '../Icon/icons/IconCloudDrizzle'
import { IconBook } from '../Icon/icons/IconBook'
import { IconInbox } from '../Icon/icons/IconInbox'
import { IconMonitor } from '../Icon/icons/IconMonitor'
import { Input } from '../Input'
import { AiCommand } from './AiCommand'
import { IconSun } from '../Icon/icons/IconSun'
import { IconMoon } from '../Icon/icons/IconMoon'
import { IconCopy } from '../Icon/icons/IconCopy'
import { AiDocsSeach } from './AiDocsSearch'
// import { SearchProvider } from './SearchProvider'

export const AiIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    className="w-6 h-6 text-purple-900"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
    />
  </svg>
)

export const COMMAND_ROUTES = {
  AI_HOME: 'Supabase AI',
  AI_ASK_ANYTHING: 'Ask me anything',
  AI_RLS_POLICY: 'Help me make a RLS policy',
  DOCS_SEARCH: 'Docs Search',
}

const AI_CHAT_ROUTES = [COMMAND_ROUTES.AI_ASK_ANYTHING, COMMAND_ROUTES.AI_RLS_POLICY]

export const AiIconChat = () => (
  <div
    className="w-7 h-7
    bg-gradient-to-r from-purple-900 to-purple-800

    ring-purple-600
    ring-1

    rounded-md border border-purple-400 flex items-center justify-center
    shadow-sm
    "
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="w-4 h-4 text-white"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  </div>
)

interface IActions {
  toggleTheme: () => void
}

const ItemHandler = (props: any) => {
  const search = useCommandState((state) => state.search)
  if (!search && props.isSubItem) return null
  return <CommandItem {...props} />
}

function CommandMenu({ actions }: { actions: IActions }) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [aiSearch, setAiSearch] = React.useState('')
  const [pages, setPages] = React.useState([])
  const page = pages[pages.length - 1]
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  const ThemeOptions = ({ isSubItem = false }) => {
    return (
      <CommandGroup>
        <ItemHandler
          isSubItem={isSubItem}
          onSelect={() => {
            actions.toggleTheme()
            setOpen(false)
          }}
        >
          Change Theme to dark
        </ItemHandler>
        <ItemHandler
          isSubItem={isSubItem}
          onSelect={() => {
            actions.toggleTheme()
            setOpen(false)
          }}
        >
          Change Theme to light
        </ItemHandler>
      </CommandGroup>
    )
  }

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && e.metaKey) {
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  function handleSetPages(pages: any, keepSearch: any) {
    setPages(pages)
    if (!keepSearch) setSearch('')
  }

  console.log('page', page)

  const showCommandInput = page === undefined || !AI_CHAT_ROUTES.includes(page)

  return (
    <>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Press{' '}
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-100 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-600 opacity-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <span className="text-xs">⌘</span>J
        </kbd>
      </p>
      <CommandDialog
        visible={open}
        onOpenChange={setOpen}
        onCancel={() => setOpen(!open)}
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
            if (!page) setOpen(false)
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
            loading={isLoading}
          />
        )}
        {/* <CommandList>
          <CommandItem>Change theme…</CommandItem>
          <SubItem>Change theme to dark</SubItem>
          <SubItem>Change theme to light</SubItem>
        </CommandList> */}

        <CommandList className={['my-2', showCommandInput && 'max-h-[300px]'].join(' ')}>
          {!page && (
            <>
              <CommandGroup heading="AI commands" forceMount>
                <CommandItem
                  onSelect={() => {
                    console.log('search', search)
                    if (search) {
                      handleSetPages([...pages, 'Supabase AI', 'Ask anything'], true)
                    } else {
                      handleSetPages([...pages, 'Supabase AI'], false)
                    }
                  }}
                  forceMount
                >
                  <AiIcon />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-900 to-purple-1100">
                    Ask Supabase AI...{' '}
                    <span className="text-scale-1200 font-semibold">{search}</span>
                  </span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSetPages([...pages, 'Docs Search'], true)}
                  forceMount
                >
                  <IconBook className="" />

                  <span>
                    Search the docs...
                    <span className="text-scale-1200 font-semibold">{search}</span>
                  </span>
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="General">
                <CommandItem>
                  <IconInbox className="text-scale-900" />
                  <CommandLabel>See what's new</CommandLabel>
                </CommandItem>
                <CommandItem onSelect={() => handleSetPages([...pages, 'Theme'], false)}>
                  <IconMonitor className="mr-2" />
                  Change theme
                </CommandItem>
                <CommandItem>
                  <IconCopy />
                  Copy current page URL
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Settings">
                <CommandItem onSelect={() => handleSetPages([...pages, 'api-keys'], true)}>
                  <CreditCard className="text-scale-900" />
                  <CommandLabel>API keys</CommandLabel>
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <User className="text-scale-900" />
                  <CommandLabel>Profile</CommandLabel>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <CreditCard className="text-scale-900" />
                  <CommandLabel>Billing</CommandLabel>
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Settings className="text-scale-900" />
                  <CommandLabel>Settings</CommandLabel>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Settings2">
                <CommandItem>
                  <User className="text-scale-900" />
                  <CommandLabel>Profile2</CommandLabel>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <CreditCard className="text-scale-900" />
                  <CommandLabel>Billing2</CommandLabel>
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Settings className="text-scale-900" />
                  <CommandLabel>Settings2</CommandLabel>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>

              <ThemeOptions isSubItem />
            </>
          )}
          {page === 'docs-search' && (
            <>
              <CommandGroup heading="Database">
                <CommandItem>
                  <Settings className="text-scale-900" />
                  <CommandLabel>Something database</CommandLabel>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Auth">
                <CommandItem>
                  <Settings className="text-scale-900" />
                  <CommandLabel>Something Auth</CommandLabel>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Settings className="text-scale-900" />
                  <CommandLabel>Something Auth 2</CommandLabel>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </>
          )}
          {page === COMMAND_ROUTES.AI_ASK_ANYTHING && (
            <>
              <AiCommand query={search} setQuery={setSearch} page={page} />
            </>
          )}
          {page === COMMAND_ROUTES.DOCS_SEARCH && (
            <>
              <AiDocsSeach
                query={search}
                setQuery={setSearch}
                page={page}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                router={router}
              />
            </>
          )}
          {page === COMMAND_ROUTES.AI_RLS_POLICY && (
            <>
              <AiCommand query={search} setQuery={setSearch} page={page} />
            </>
          )}
          {page === 'api-keys' && (
            <>
              <CommandGroup heading="">
                <CommandItem>
                  <Settings className="text-scale-900" />
                  <CommandLabel>Copy Anon key</CommandLabel>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <div className="w-full flex">
                <code className="bg-scale-100 rounded mx-2 px-2 w-full text-scale-1200 text-sm py-3">
                  I AM SOME KEYS I AM SOME KEYS I AM SOME KEYS I AM SOME KEYS I AM SOME KEYS I AM
                </code>
              </div>
              <CommandGroup heading="">
                <CommandItem>
                  <Settings className="text-scale-900" />
                  <CommandLabel>Copy Service role key</CommandLabel>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <div className="w-full flex">
                <code className="bg-scale-100 rounded mx-2 px-2 w-full text-scale-1200 text-sm py-3">
                  I AM SOME KEYS I AM SOME KEYS I AM SOME KEYS I AM SOME KEYS I AM SOME KEYS I AM
                </code>
              </div>
              <CommandGroup heading="">
                <CommandItem>
                  <Settings className="text-scale-900" />
                  <CommandLabel>Roll new keys</CommandLabel>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Settings className="text-scale-900" />
                  <CommandLabel>Switch project</CommandLabel>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {page === 'Supabase AI' && (
            <>
              <CommandGroup forceMount>
                <CommandItem
                  onSelect={() => handleSetPages([...pages, COMMAND_ROUTES.AI_ASK_ANYTHING], true)}
                  forceMount
                >
                  <AiIcon />
                  <CommandLabel className="text-transparent bg-clip-text bg-gradient-to-r from-purple-900 to-purple-1100">
                    Ask Supabase AI...{' '}
                    <span className="text-scale-1200 font-semibold">{search}</span>
                  </CommandLabel>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSetPages([...pages, COMMAND_ROUTES.AI_RLS_POLICY], false)}
                >
                  <AiIcon />
                  <CommandLabel>Help me make an RLS policy</CommandLabel>
                </CommandItem>
                <CommandItem>
                  <AiIcon />
                  <CommandLabel>Help me make an Postgres function</CommandLabel>
                </CommandItem>
                <CommandItem>
                  <AiIcon />
                  <CommandLabel>Help me make an Postgres trigger</CommandLabel>
                </CommandItem>
                <CommandItem>
                  <AiIcon />
                  <CommandLabel>Help me make a table</CommandLabel>
                </CommandItem>
              </CommandGroup>
            </>
          )}
          {page === 'Theme' && (
            <>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    router.push('https://supabase.com/docs')
                    setOpen(false)
                  }}
                >
                  <CommandLabel>Grab api keys</CommandLabel>
                </CommandItem>
              </CommandGroup>
              <ThemeOptions />
            </>
          )}
          {page !== 'Ask anything' || (!page && <CommandEmpty>No results found.</CommandEmpty>)}
        </CommandList>
      </CommandDialog>
      {/* <AiCommand /> */}
    </>
  )
}

export { CommandMenu }
