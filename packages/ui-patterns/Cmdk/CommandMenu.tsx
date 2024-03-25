import { useParams } from 'common'
import { useRouter } from 'next/router'
import * as React from 'react'

import { AiIconAnimation } from 'ui/src/layout/ai-icon-animation/ai-icon-animation'
import { IconHome } from 'ui/src/components/Icon/icons/IconHome'
import { IconArrowRight } from 'ui/src/components/Icon/icons/IconArrowRight'
import { IconBook } from 'ui/src/components/Icon/icons/IconBook'
import { IconColumns } from 'ui/src/components/Icon/icons/IconColumns'
import { IconInbox } from 'ui/src/components/Icon/icons/IconInbox'
import { IconKey } from 'ui/src/components/Icon/icons/IconKey'
import { IconLifeBuoy } from 'ui/src/components/Icon/icons/IconLifeBuoy'
import { IconLink } from 'ui/src/components/Icon/icons/IconLink'
import { IconMonitor } from 'ui/src/components/Icon/icons/IconMonitor'
import { IconPhone } from 'ui/src/components/Icon/icons/IconPhone'
import { IconUser } from 'ui/src/components/Icon/icons/IconUser'
import APIKeys from './APIKeys'
import AiCommand from './AiCommand'
import ChildItem from './ChildItem'
import { BadgeExperimental } from './Command.Badges'
import { COMMAND_ROUTES } from './Command.constants'
import { AiIcon } from './Command.icons'
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandLabel,
  CommandList,
  copyToClipboard,
} from './Command.utils'
import { useCommandMenu } from './CommandMenuProvider'
import CommandMenuShortcuts from './CommandMenuShortcuts'
import DocsSearch from './DocsSearch'
import GenerateSQL from './GenerateSQL'
import SearchableStudioItems from './SearchableStudioItems'
import ThemeOptions from './ThemeOptions'
import sharedItems from './utils/shared-nav-items.json'

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
        setIsOpen={setIsOpen}
        page={currentPage}
        visible={isOpen}
        onOpenChange={() => {
          setIsOpen(!isOpen)
        }}
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
              <CommandGroup heading="Documentation" forceMount={true}>
                <CommandItem
                  type="command"
                  onSelect={() => setPages([...pages, COMMAND_ROUTES.DOCS_SEARCH])}
                  forceMount={true}
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
                  onSelect={() => {
                    setPages([...pages, COMMAND_ROUTES.AI])
                  }}
                  forceMount={true}
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
