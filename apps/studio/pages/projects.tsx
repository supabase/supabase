import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

import ProjectList from 'components/interfaces/Home/ProjectList'
import { AccountLayout } from 'components/layouts'
import OrganizationDropdown from 'components/to-be-cleaned/Dropdown/OrganizationDropdown'
import AlertError from 'components/ui/AlertError'
import Connecting from 'components/ui/Loading/Loading'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useAutoProjectsPrefetch } from 'data/projects/projects-query'
import { useFlag, useIsFeatureEnabled } from 'hooks'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useProfile } from 'lib/profile'
import { NextPageWithLayout } from 'types'
import {
  Input_Shadcn_,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SidePanel,
  Button,
  Label_Shadcn_,
  Command_Shadcn_,
  CommandInput_Shadcn_,
  CommandList_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandSeparator_Shadcn_,
  Popover_Shadcn_,
  PopoverTrigger_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverAnchor_Shadcn_,
  AiIcon,
  cn,
} from 'ui'
import { LabelList } from 'recharts'
import { ChevronsUpDown } from 'lucide-react'
import { PopoverAnchor } from '@radix-ui/react-popover'

const ProjectsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const {
    data: organizations,
    isLoading: isOrganizationLoading,
    isError,
    isSuccess,
  } = useOrganizationsQuery()
  useAutoProjectsPrefetch()

  const projectCreationEnabled = useIsFeatureEnabled('projects:create')

  const { isLoading: isProfileLoading } = useProfile()
  const isLoading = isOrganizationLoading || isProfileLoading
  const navLayoutV2 = useFlag('navigationLayoutV2')
  const hasWindowLoaded = typeof window !== 'undefined'

  useEffect(() => {
    if (navLayoutV2 && isSuccess && hasWindowLoaded) {
      const localStorageSlug = localStorage.getItem(
        LOCAL_STORAGE_KEYS.RECENTLY_VISITED_ORGANIZATION
      )
      const verifiedSlug = organizations.some((org) => org.slug === localStorageSlug)

      if (organizations.length === 0) router.push('/new')
      else if (localStorageSlug && verifiedSlug) router.push(`/org/${localStorageSlug}`)
      else router.push(`/org/${organizations[0].slug}`)
    }
  }, [navLayoutV2, isSuccess, hasWindowLoaded])

  return (
    <>
      {(navLayoutV2 || isLoading) && (
        <div className={`flex items-center justify-center h-full`}>
          <Connecting />
        </div>
      )}

      {isError && (
        <div
          className={`py-4 px-5 ${navLayoutV2 ? 'h-full flex items-center justify-center' : ''}`}
        >
          <AlertError subject="Failed to retrieve organizations" />
        </div>
      )}

      {!navLayoutV2 && isSuccess && (
        <div className="py-4 px-5">
          {IS_PLATFORM && projectCreationEnabled && organizations.length !== 0 && (
            <div className="my-2">
              <div className="flex">
                <div className="">
                  <OrganizationDropdown organizations={organizations} />
                </div>
              </div>
            </div>
          )}
          <div className="my-8 space-y-8">
            <ProjectList />
          </div>
        </div>
      )}
    </>
  )
}

ProjectsPage.getLayout = (page) => (
  <AccountLayout
    title="Dashboard"
    breadcrumbs={[
      {
        key: `supabase-projects`,
        label: 'Projects',
      },
    ]}
  >
    {page}

    <ChatDemo />
  </AccountLayout>
)

function ChatDemo() {
  const [commandOpen, setCommandOpen] = useState<boolean>(false)
  const [command, setCommand] = useState<string>('')
  const [value, setValue] = useState<string>('')

  const commandRef = useRef<HTMLSpanElement>(null)

  const commandWidth = commandRef.current?.clientWidth

  const targetInputRef = useRef<HTMLInputElement | null>(null)
  const originalInputRef = useRef<HTMLInputElement | null>(null)

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'Enter') {
      // Forward the event to the target input
      if (targetInputRef.current) {
        const keyboardEvent = new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          composed: true,
          key: event.key,
          code: event.code,
        })

        targetInputRef.current.dispatchEvent(keyboardEvent)

        // Schedule focus on the original input using requestAnimationFrame
        requestAnimationFrame(() => {
          if (originalInputRef.current) {
            originalInputRef.current.focus()
          }
        })

        // Prevent the default behavior for ArrowUp, ArrowDown, and Enter
        event.preventDefault()
      }
    }
  }

  useEffect(() => {}, [command, commandRef])

  const resultArray = value.split(/(\s+)/).filter(Boolean)

  console.log(resultArray)
  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button type="outline">Open</Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
            <SheetDescription>
              Make changes to your profile here. Click save when you're done.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 py-4 grow">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label_Shadcn_ htmlFor="name" className="text-right">
                Name
              </Label_Shadcn_>
              <Input_Shadcn_ id="name" value="Pedro Duarte" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label_Shadcn_ htmlFor="username" className="text-right">
                Username
              </Label_Shadcn_>
              <Input_Shadcn_ id="username" value="@peduarte" className="col-span-3" />
            </div>
          </div>
          <div className="">
            <Popover_Shadcn_
              open={commandOpen}
              onOpenChange={() => {
                setCommandOpen(!commandOpen)
                if (originalInputRef) originalInputRef?.current?.focus()
              }}
            >
              <PopoverAnchor_Shadcn_>
                <div className="h-[48px] flex items-center w-full relative">
                  <div
                    style={{
                      marginLeft:
                        command && commandWidth ? `${48 + commandWidth + 12}px` : `${48}px`,
                    }}
                    className={cn('absolute flex items-center text-sm text-transparent')}
                  >
                    {resultArray.map((item, i) => (
                      <span
                        key={i}
                        className={
                          item === '/fix' ||
                          item === '/improve' ||
                          item === '/explain' ||
                          item === '/help'
                            ? 'bg-brand-400 border-brand-400 border border-9'
                            : ''
                        }
                      >
                        {item === ' ' ? '\u00A0' : item}
                      </span>
                    ))}
                  </div>
                  <Input_Shadcn_
                    id="ai-input"
                    autoFocus
                    ref={originalInputRef}
                    onKeyDown={(event) => {
                      if (event.key === '/' && !value) {
                        // Add your action here
                        setCommandOpen(true)
                        if (originalInputRef) originalInputRef?.current?.focus()
                      } else if (event.key === 'Escape') {
                        // Add your action here
                        setCommandOpen(false)
                      } else {
                        handleKeyPress(event)
                      }
                    }}
                    style={{
                      paddingLeft:
                        command && commandWidth ? `${48 + commandWidth + 12}px` : `${48}px`,
                    }}
                    value={value}
                    onChange={(event) => {
                      setValue(event.target.value)
                      if (!event.target.value) setCommandOpen(false)
                    }}
                    placeholder="Ask a question or type in '/' for actions"
                    className="absolute bg-transparent border-muted rounded-full px-5 w-full h-full placeholder:text-lightest"
                  />
                  <figure className="h-full w-[48px] flex items-center justify-center">
                    <AiIcon className="" />
                  </figure>
                  {/* {command && (
                    <span
                      ref={commandRef}
                      className="relative bg-surface-200 font-mono text-default p-1 py-0.5 rounded-lg border border-strong text-sm"
                    >
                      {command}
                    </span>
                  )} */}
                </div>
              </PopoverAnchor_Shadcn_>
              <PopoverContent_Shadcn_
                className="w-[420px] p-0"
                align="start"
                onOpenAutoFocus={(event) => {
                  event.preventDefault()
                  // if (originalInputRef) originalInputRef?.current?.focus()
                }}
              >
                <Command_Shadcn_>
                  <CommandInput_Shadcn_
                    placeholder="Type a command or search..."
                    wrapperClassName="hidden"
                    value={value}
                    ref={targetInputRef}
                    tabIndex={-1}
                    autoFocus={false}
                  />
                  <CommandList_Shadcn_>
                    <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
                    <CommandGroup_Shadcn_ heading="Suggestions">
                      <CommandItem_Shadcn_
                        value="/ Add policy for org Inserted User Access"
                        className="text-sm text-default flex gap-3"
                        onSelect={() => {
                          setValue('Add policy for org Inserted User Access')
                          setCommandOpen(false)
                        }}
                      >
                        <AiIcon className="scale-75" />
                        Add policy for org Inserted User Access
                      </CommandItem_Shadcn_>
                      <CommandItem_Shadcn_
                        value="/ Add policy for User-Specific Todo Access"
                        className="text-sm text-default flex gap-3"
                        onSelect={() => {
                          setValue('Add policy for User-Specific Todo Access')
                          setCommandOpen(false)
                        }}
                      >
                        <AiIcon className="scale-75" />
                        Add policy for User-Specific Todo Access
                      </CommandItem_Shadcn_>
                      <CommandItem_Shadcn_
                        value="/ Add policy for Org Update Restriction"
                        className="text-sm text-default flex gap-3"
                        onSelect={() => {
                          setValue('Add policy for Org Update Restriction')
                          setCommandOpen(false)
                        }}
                      >
                        <AiIcon className="scale-75" />
                        Add policy for Org Update Restriction
                      </CommandItem_Shadcn_>
                    </CommandGroup_Shadcn_>
                    <CommandSeparator_Shadcn_ />
                    <CommandGroup_Shadcn_ heading="Commands">
                      <CommandItem_Shadcn_
                        className="text-sm gap-0.5"
                        onSelect={() => {
                          setValue('/fix ')
                          setCommandOpen(false)
                        }}
                      >
                        <span className="text-brand">/</span>
                        <span className="text-default">fix</span>
                      </CommandItem_Shadcn_>
                      <CommandItem_Shadcn_
                        className="text-sm gap-0.5"
                        onSelect={() => {
                          setValue('/improve ')
                          setCommandOpen(false)
                        }}
                      >
                        <span className="text-brand">/</span>
                        <span className="text-default">improve</span>
                      </CommandItem_Shadcn_>
                      <CommandItem_Shadcn_
                        className="text-sm gap-0.5"
                        onSelect={() => {
                          setValue('/explain ')
                          setCommandOpen(false)
                        }}
                      >
                        <span className="text-brand">/</span>
                        <span className="text-default">explain</span>
                      </CommandItem_Shadcn_>
                      <CommandItem_Shadcn_
                        className="text-sm gap-0.5"
                        onSelect={() => {
                          setValue('/help ')
                          setCommandOpen(false)
                        }}
                      >
                        <span className="text-brand">/</span>
                        <span className="text-default">help</span>
                      </CommandItem_Shadcn_>
                    </CommandGroup_Shadcn_>
                  </CommandList_Shadcn_>
                </Command_Shadcn_>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button htmlType="submit">Save changes</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default ProjectsPage
