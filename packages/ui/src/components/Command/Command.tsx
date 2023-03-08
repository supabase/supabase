import React from 'react'

import { Calculator, Calendar, CreditCard, Settings, Smile, User } from 'lucide-react'
import { useCommandState } from 'cmdk-supabase'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemStale,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './Command.utils'
import { IconCloudDrizzle } from '../Icon/icons/IconCloudDrizzle'
import { IconBook } from '../Icon/icons/IconBook'
import { IconInbox } from '../Icon/icons/IconInbox'
import { Input } from '../Input'
import { AiCommand } from './AiCommand'
// import { SearchProvider } from './SearchProvider'

const SubItem = (props) => {
  const search = useCommandState((state) => state.search)
  if (!search) return null
  return <CommandItem {...props} />
}

function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [aiSearch, setAiSearch] = React.useState('')
  const [pages, setPages] = React.useState([])
  const page = pages[pages.length - 1]

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && e.metaKey) {
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  function handleSetPages(pages, keepSearch) {
    setPages(pages)
    if (!keepSearch) setSearch('')
  }

  const AiIcon = () => (
    // <svg
    //   xmlns="http://www.w3.org/2000/svg"
    //   fill="none"
    //   viewBox="0 0 24 24"
    //   stroke-width="1.5"
    //   stroke="currentColor"
    //   className="w-6 h-6 mr-2 text-brand-900"
    // >
    //   <path
    //     stroke-linecap="round"
    //     stroke-linejoin="round"
    //     d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
    //   />
    // </svg>
    <div
      className="w-7 h-7 mr-2 
                    
                    bg-gradient-to-r from-purple-900 to-pink-900
                    
                    rounded-lg border border-pink-400 flex items-center justify-center
                    shadow-sm
                    "
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        className="w-2 h-2 text-white"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
        />
      </svg>
    </div>
  )

  const AiItem = () => (
    <CommandItem onSelect={() => handleSetPages([...pages, 'Ask anything'], true)}>
      {/* <IconCloudDrizzle strokeWidth={2} className="text-brand-900 mr-2 h-4 w-4" /> */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        className="w-6 h-6 mr-2 text-brand-900"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
        />
      </svg>

      <span>
        Ask Supabase AI... <span className="text-scale-1200 font-semibold">{search}</span>
      </span>
    </CommandItem>
  )

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
            setPages((pages) => pages.slice(0, -1))
          }
        }}
      >
        <div className="flex w-full gap-3 px-4 pt-2 justify-items-start flex-row">
          {pages.length > 0 && <CommandShortcut>{'Home'}</CommandShortcut>}
          {pages.map((page) => (
            <CommandShortcut>{page}</CommandShortcut>
          ))}
        </div>
        {/* <CommandShortcut>Docs</CommandShortcut> */}
        {page !== 'Ask anything' && (
          <CommandInput
            placeholder="Type a command or search..."
            value={search}
            onValueChange={setSearch}
          />
        )}
        {/* <CommandList>
          <CommandItem>Change theme…</CommandItem>
          <SubItem>Change theme to dark</SubItem>
          <SubItem>Change theme to light</SubItem>
        </CommandList> */}

        <CommandList className={['my-2', page !== 'Ask anything' && 'max-h-[300px]'].join(' ')}>
          {!page && (
            <>
              <CommandGroup heading="Suggestions" forceMount>
                <CommandItem
                  onSelect={() => handleSetPages([...pages, 'Supabase AI'], false)}
                  forceMount
                >
                  <AiIcon />
                  <span>
                    Ask Supabase AI...
                    <span className="text-scale-1200 font-semibold">{search}</span>
                  </span>
                </CommandItem>
                <CommandItem forceMount>
                  <IconInbox className="text-scale-900 mr-2 h-4 w-4" />
                  <span>See what's new</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSetPages([...pages, 'docs-search'], true)}
                  forceMount
                >
                  <IconBook className="mr-2" />

                  <span>
                    Search the docs...
                    <span className="text-scale-1200 font-semibold">{search}</span>
                  </span>
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="General">
                <CommandItem onSelect={() => handleSetPages([...pages, 'Theme'], false)}>
                  Change theme
                </CommandItem>
                <CommandItem>Copy current page URL</CommandItem>
              </CommandGroup>
              <CommandGroup heading="Settings">
                <CommandItem onSelect={() => handleSetPages([...pages, 'api-keys'], true)}>
                  <CreditCard className="text-scale-900 mr-2 h-4 w-4" />
                  <span>API keys</span>
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <User className="text-scale-900 mr-2 h-4 w-4" />
                  <span>Profile</span>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <CreditCard className="text-scale-900 mr-2 h-4 w-4" />
                  <span>Billing</span>
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Settings className="text-scale-900 mr-2 h-4 w-4" />
                  <span>Settings</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Settings2">
                <CommandItem>
                  <User className="text-scale-900 mr-2 h-4 w-4" />
                  <span>Profile2</span>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <CreditCard className="text-scale-900 mr-2 h-4 w-4" />
                  <span>Billing2</span>
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Settings className="text-scale-900 mr-2 h-4 w-4" />
                  <span>Settings2</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </>
          )}
          {page === 'docs-search' && (
            <>
              <CommandGroup heading="Database">
                <CommandItem>
                  <Settings className="text-scale-900 mr-2 h-4 w-4" />
                  <span>Something database</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Auth">
                <CommandItem>
                  <Settings className="text-scale-900 mr-2 h-4 w-4" />
                  <span>Something Auth</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Settings className="text-scale-900 mr-2 h-4 w-4" />
                  <span>Something Auth 2</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </>
          )}
          {page === 'Ask anything' && (
            <>
              <div className="min-h-[300px] flex flex-col">
                <div className="">
                  <div className="mx-3 text-scale-900">Back</div>
                </div>
                <div className="grow">
                  <div className="mx-3">Something</div>
                </div>
                <div className="">
                  <AiCommand />
                </div>

                {/* <div className="bg-scale-100 rounded mx-3">
                  <Input
                    placeholder="Ask Supabase AI something..."
                    autoFocus
                    value={aiSearch}
                    actions={
                      <div className="mr-3 flex items-center h-full">
                        <span className="text-xs text-scale-800">Submit message</span>
                      </div>
                    }
                    onChange={(e) => setAiSearch(e.target.value)}
                  />
                </div> */}
              </div>
            </>
          )}
          {page === 'api-keys' && (
            <>
              <CommandGroup heading="">
                <CommandItem>
                  <Settings className="text-scale-900 mr-2 h-4 w-4" />
                  <span>Copy Anon key</span>
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
                  <Settings className="text-scale-900 mr-2 h-4 w-4" />
                  <span>Copy Service role key</span>
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
                  <Settings className="text-scale-900 mr-2 h-4 w-4" />
                  <span>Roll new keys</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Settings className="text-scale-900 mr-2 h-4 w-4" />
                  <span>Switch project</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {page === 'Supabase AI' && (
            <>
              <CommandGroup>
                <CommandItem onSelect={() => handleSetPages([...pages, 'Ask anything'], true)}>
                  <AiIcon />
                  Ask Supabase AI anything...
                </CommandItem>
                <CommandItem>
                  {' '}
                  <AiIcon />
                  Help me make an RLS policy
                </CommandItem>
                <CommandItem>
                  {' '}
                  <AiIcon />
                  Help me make an Postgres function
                </CommandItem>
                <CommandItem>
                  {' '}
                  <AiIcon />
                  Help me make an Postgres trigger
                </CommandItem>
                <CommandItem>
                  {' '}
                  <AiIcon />
                  Help me make a table
                </CommandItem>
              </CommandGroup>
            </>
          )}
          {page === 'Theme' && (
            <CommandGroup>
              <CommandItem>Change Theme to dark</CommandItem>
              <CommandItem>Change Theme to light</CommandItem>
            </CommandGroup>
          )}
          {page !== 'Ask anything' && <CommandEmpty>No results found.</CommandEmpty>}
        </CommandList>
      </CommandDialog>
      {/* <AiCommand /> */}
    </>
  )
}

export { CommandMenu }
