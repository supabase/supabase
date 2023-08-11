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
import { IconKey } from './../Icon/icons/IconKey'

import AiCommand from './AiCommand'
import sharedItems from './utils/shared-nav-items.json'
import { AiIcon } from './Command.icons'
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandLabel,
  CommandList,
} from './Command.utils'
import { COMMAND_ROUTES } from './Command.constants'
import { useCommandMenu } from './CommandMenuProvider'

import DocsSearch from './DocsSearch'
import GenerateSQL from './GenerateSQL'
import ThemeOptions from './ThemeOptions'
import APIKeys from './APIKeys'
import SearchableStudioItems from './SearchableStudioItems'
import CommandMenuShortcuts from './CommandMenuShortcuts'
import { BadgeExperimental } from './Command.Badges'
import { AiIconAnimation } from '@ui/layout/ai-icon-animation'

export const CHAT_ROUTES = [
  COMMAND_ROUTES.AI, // this one is temporary
  COMMAND_ROUTES.AI_ASK_ANYTHING,
  COMMAND_ROUTES.AI_RLS_POLICY,
  COMMAND_ROUTES.GENERATE_SQL,
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

interface CommandMenuProps {
  projectRef?: string
}

const CommandMenu = ({ projectRef }: CommandMenuProps) => {
  const router = useRouter()

  const commandInputRef = useRef<ElementRef<typeof CommandInput>>(null)
  const { isOpen, setIsOpen, search, setSearch, pages, setPages, currentPage, site } =
    useCommandMenu()
  const showCommandInput = !currentPage || !CHAT_ROUTES.includes(currentPage)

  return (
    <>
      <CommandDialog
        page={currentPage}
        visible={isOpen}
        onInteractOutside={(e) => {
          // Only hide menu when clicking outside, not focusing outside
          // Prevents Firefox dropdown issue that immediately closes menu after opening
          if (e.type === 'dismissableLayer.pointerDownOutside') {
            setIsOpen(!open)
          }
        }}
        size={'xlarge'}
        className={'max-h-[70vh] lg:max-h-[50vh] overflow-hidden overflow-y-auto'}
      >
        {pages.length > 0 && <CommandMenuShortcuts />}
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
                  onSelect={() => setPages([...pages, COMMAND_ROUTES.DOCS_SEARCH])}
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
                <CommandItem
                  type="command"
                  badge={<BadgeExperimental />}
                  onSelect={() => {
                    setPages([...pages, COMMAND_ROUTES.AI])
                  }}
                  forceMount
                >
                  <AiIconAnimation />
                  <span className="text-brand">
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
              </CommandGroup>

              {site === 'docs' && (
                <CommandGroup heading="Quickstarts">
                  {sharedItems.quickstarts.map((item) => (
                    <CommandItem key={item.url} type="link" onSelect={() => router.push(item.url)}>
                      <IconArrowRight className="text-scale-900" />
                      <CommandLabel>
                        Start with <span className="font-bold"> {item.label}</span>
                      </CommandLabel>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {site === 'docs' && (
                <CommandGroup heading="Projects">
                  {sharedItems.projectTools.map((item) => (
                    <CommandItem key={item.url} type="link" onSelect={() => router.push(item.url)}>
                      <IconArrowRight className="text-scale-900" />
                      <CommandLabel>
                        <span className="font-bold"> {item.label}</span>
                      </CommandLabel>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {site === 'docs' && (
                <CommandGroup heading="Studio tools">
                  {sharedItems.tools.map((item) => (
                    <CommandItem key={item.url} type="link" onSelect={() => router.push(item.url)}>
                      <IconArrowRight className="text-scale-900" />
                      <CommandLabel>
                        Go to <span className="font-bold"> {item.label}</span>
                      </CommandLabel>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {site === 'studio' && (
                <CommandGroup heading="Experimental">
                  <CommandItem
                    forceMount
                    type="command"
                    badge={<BadgeExperimental />}
                    onSelect={() => setPages([...pages, COMMAND_ROUTES.GENERATE_SQL])}
                  >
                    <AiIcon className="text-scale-1100" />
                    <CommandLabel>Generate SQL with Supabase AI</CommandLabel>
                  </CommandItem>
                </CommandGroup>
              )}

              {site === 'studio' && projectRef !== undefined && (
                <CommandGroup heading="Project tools">
                  <CommandItem
                    forceMount
                    type="command"
                    onSelect={() => setPages([...pages, COMMAND_ROUTES.API_KEYS])}
                  >
                    <IconKey className="text-scale-1100" />
                    <CommandLabel>Get API keys</CommandLabel>
                  </CommandItem>
                </CommandGroup>
              )}

              {site === 'studio' && (
                <CommandGroup heading="Navigate">
                  {sharedItems.tools.map((item) => {
                    const itemUrl = (
                      projectRef ? item.url.replace('_', projectRef) : item.url
                    ).split('https://supabase.com/dashboard')[1]

                    return (
                      <CommandItem
                        key={item.url}
                        type="link"
                        onSelect={() => {
                          router.push(item.url)
                          setIsOpen(false)
                        }}
                      >
                        <IconArrowRight className="text-scale-900" />
                        <CommandLabel>
                          Go to <span className="font-bold"> {item.label}</span>
                        </CommandLabel>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              {/* <DashboardTableEditor /> */}

              <CommandGroup heading="Support">
                {sharedItems.support.map((item) => (
                  <CommandItem key={item.url} type="link" onSelect={() => router.push(item.url)}>
                    <IconLifeBuoy className="text-scale-900" />
                    <CommandLabel>
                      Go to <span className="font-bold"> {item.label}</span>
                    </CommandLabel>
                  </CommandItem>
                ))}
              </CommandGroup>

              {site === 'docs' && (
                <CommandGroup heading="General">
                  {sharedItems.docsGeneral.map((item) => (
                    <CommandItem key={item.url} type="link" onSelect={() => router.push(item.url)}>
                      {item?.icon && iconPicker[item.icon]}
                      <CommandLabel>{item.label}</CommandLabel>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandGroup heading="Settings">
                <CommandItem type="link" onSelect={() => setPages([...pages, 'Theme'])}>
                  <IconMonitor />
                  Change theme
                </CommandItem>
              </CommandGroup>

              <ThemeOptions isSubItem />
              {site === 'studio' && search && <SearchableStudioItems />}
            </>
          )}
          {currentPage === COMMAND_ROUTES.AI && <AiCommand />}
          {currentPage === COMMAND_ROUTES.DOCS_SEARCH && <DocsSearch />}
          {currentPage === COMMAND_ROUTES.GENERATE_SQL && <GenerateSQL />}
          {currentPage === COMMAND_ROUTES.THEME && <ThemeOptions />}
          {currentPage === COMMAND_ROUTES.API_KEYS && <APIKeys />}
        </CommandList>
      </CommandDialog>
    </>
  )
}

export default CommandMenu
