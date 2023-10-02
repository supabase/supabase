import { useStore } from 'hooks'
import { useState } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Popover_Shadcn_,
  PopoverTrigger_Shadcn_,
  Button,
  PopoverContent_Shadcn_,
  Command_Shadcn_,
  CommandList_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  IconCode,
  IconChevronLeft,
} from 'ui'
import { DOCS_RESOURCE_CONTENT } from './ProjectAPIDocs.constants'
import { navigateToSection } from './Content/Content.utils'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useParams } from 'common'

const SecondLevelNav = () => {
  const { ref } = useParams()
  const { meta } = useStore()
  const snap = useAppStateSnapshot()
  const [open, setOpen] = useState(false)

  const { data } = meta.openApi
  const tables = data?.tables ?? []
  const functions = data?.functions ?? []
  const [section, resource] = snap.activeDocsSection

  const { data: buckets } = useBucketsQuery({ projectRef: ref })
  const bucket = (buckets ?? []).find((b) => b.name === resource)

  const header =
    section === 'entities'
      ? 'Tables & Views'
      : section === 'stored-procedures'
      ? 'Stored Procedures'
      : section === 'storage'
      ? 'Storage Buckets'
      : section
  const options =
    section === 'entities'
      ? tables
      : section === 'stored-procedures'
      ? functions
      : section === 'storage'
      ? buckets ?? []
      : []

  const updateSection = (value: string) => {
    snap.setActiveDocsSection([snap.activeDocsSection[0], value])
    setOpen(false)
  }

  const menuItems = Object.values(DOCS_RESOURCE_CONTENT).filter(
    (content) => content.category === snap.activeDocsSection[0]
  )

  return (
    <div className="px-2 py-4 space-y-2">
      <div className="flex items-center space-x-2">
        <Button
          type="text"
          icon={<IconChevronLeft />}
          className="px-1"
          onClick={() => snap.setActiveDocsSection([snap.activeDocsSection[0]])}
        />
        <p className="text-sm text-foreground-light capitalize">{header}</p>
      </div>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button block type="default" size="small" className="[&>span]:w-full">
            <div>
              <div className="flex items-center justify-between w-full">
                <p>{snap.activeDocsSection[1]}</p>
                <div>
                  <IconCode className="rotate-90" strokeWidth={1.5} size={12} />
                </div>
              </div>
            </div>
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
          <Command_Shadcn_>
            <CommandList_Shadcn_>
              <CommandGroup_Shadcn_>
                {options.map((option) => (
                  <CommandItem_Shadcn_
                    key={option.name}
                    className="cursor-pointer"
                    onSelect={() => updateSection(option.name)}
                    onClick={() => updateSection(option.name)}
                  >
                    <p>{option.name}</p>
                  </CommandItem_Shadcn_>
                ))}
              </CommandGroup_Shadcn_>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>

      <div className="space-y-2 py-2">
        {menuItems.map((item) => {
          if (
            section === 'storage' &&
            bucket !== undefined &&
            !bucket.public &&
            item.key === 'retrieve-public-url'
          )
            return null
          return (
            <p
              key={item.key}
              title={item.title}
              className="text-sm text-light px-4 hover:text-foreground transition cursor-pointer"
              onClick={() => navigateToSection(item.key)}
            >
              {item.title}
            </p>
          )
        })}
      </div>
    </div>
  )
}

export default SecondLevelNav
