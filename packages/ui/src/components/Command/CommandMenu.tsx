import { useRouter } from 'next/router'
import * as React from 'react'
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
import { IconLink } from './../Icon/icons/IconLink'

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
  FORCE_MOUNT_ITEM,
  copyToClipboard,
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
import ChildItem from './ChildItem'
import { useParams } from 'common'

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

const CommandMenu = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()

  const {
    isOpen,
    setIsOpen,
    search,
    setSearch,
    pages,
    setPages,
    currentPage,
    site,
    project,
    inputRef: commandInputRef,
  } = useCommandMenu()
  const showCommandInput = !currentPage || !CHAT_ROUTES.includes(currentPage)

  // This function has been added to prevent the use of double quotes in the search docs input due to an issue with the cmdk-supabase module. This function can be removed when we transition to using cmdk.
  const handleInputChange = (value: string) => {
    const newValue = value.replace(/"/g, '') // Remove double quotes
    setSearch(newValue)
  }

  const commandListMaxHeight =
    currentPage === COMMAND_ROUTES.DOCS_SEARCH ||
    currentPage === COMMAND_ROUTES.AI ||
    currentPage === COMMAND_ROUTES.GENERATE_SQL
      ? 'min(600px, 50vh)'
      : '300px'

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
            onValueChange={handleInputChange}
          />
        )}
        <CommandList
          style={{
            maxHeight: commandListMaxHeight,
            height:
              currentPage === COMMAND_ROUTES.DOCS_SEARCH ||
              currentPage === COMMAND_ROUTES.AI ||
              currentPage === COMMAND_ROUTES.GENERATE_SQL
                ? commandListMaxHeight
                : 'auto',
          }}
          className="my-2"
        >
          {!currentPage && (
            <>
              <CommandGroup heading="Documentation">
                <CommandItem
                  type="command"
                  value={site === 'docs' ? `${FORCE_MOUNT_ITEM}--docs-search` : undefined}
                  onSelect={() => setPages([...pages, COMMAND_ROUTES.DOCS_SEARCH])}
                >
                  <IconBook />

                  <span>
                    Search the docs
                    {search ? (
                      <>
                        {': '}
                        <span className="text-foreground font-semibold">{search}</span>
                      </>
                    ) : (
                      '...'
                    )}
                  </span>
                </CommandItem>
                <CommandItem
                  type="command"
                  value={site === 'docs' ? `${FORCE_MOUNT_ITEM}--ai-info` : undefined}
                  onSelect={() => {
                    setPages([...pages, COMMAND_ROUTES.AI])
                  }}
                >
                  <AiIconAnimation />
                  <span className="text-brand">
                    Ask Supabase AI
                    {search ? (
                      <>
                        {': '}
                        <span className="text-foreground font-semibold">{search}</span>
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
                      <IconArrowRight className="text-foreground-muted" />
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
                    <CommandItem
                      key={item.url}
                      type="link"
                      onSelect={() =>
                        window.open(`https://supabase.com/dashboard${item.url}`, '_blank')
                      }
                    >
                      <IconArrowRight className="text-foreground-muted" />
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
                    <CommandItem
                      key={item.url}
                      type="link"
                      onSelect={() =>
                        window.open(`https://supabase.com/dashboard${item.url}`, '_blank')
                      }
                    >
                      <IconArrowRight className="text-foreground-muted" />
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
                    type="command"
                    badge={<BadgeExperimental />}
                    onSelect={() => setPages([...pages, COMMAND_ROUTES.GENERATE_SQL])}
                  >
                    <AiIcon className="text-foreground-light" />
                    <CommandLabel>Generate SQL with Supabase AI</CommandLabel>
                  </CommandItem>
                </CommandGroup>
              )}

              {site === 'studio' && projectRef !== undefined && (
                <CommandGroup heading="Project tools">
                  <CommandItem
                    type="command"
                    onSelect={() => {
                      setSearch('')
                      setPages([...pages, COMMAND_ROUTES.API_KEYS])
                    }}
                  >
                    <IconKey className="text-foreground-light" />
                    <CommandLabel>Get API keys</CommandLabel>
                  </CommandItem>
                  {project?.apiUrl !== undefined && (
                    <ChildItem
                      isSubItem={false}
                      onSelect={() => {
                        copyToClipboard(project?.apiUrl ?? '')
                        setIsOpen(false)
                      }}
                      className="space-x-2"
                    >
                      <IconLink className="text-foreground-light" />
                      <CommandLabel>Copy API URL</CommandLabel>
                    </ChildItem>
                  )}
                </CommandGroup>
              )}

              {site === 'studio' && (
                <CommandGroup heading="Navigate">
                  {sharedItems.tools.map((item) => {
                    const itemUrl = projectRef ? item.url.replace('_', projectRef) : item.url

                    return (
                      <CommandItem
                        key={item.url}
                        type="link"
                        onSelect={() => {
                          router.push(itemUrl)
                          setIsOpen(false)
                        }}
                      >
                        <IconArrowRight className="text-foreground-muted" />
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
                    <IconLifeBuoy className="text-foreground-muted" />
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
                <CommandItem
                  type="link"
                  onSelect={() => {
                    setSearch('')
                    setPages([...pages, 'Theme'])
                  }}
                >
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
