import { useParams } from 'common'
import Link from 'next/link'
import { useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconChevronLeft,
  IconCode,
  IconExternalLink,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useOpenAPISpecQuery } from 'data/open-api/api-spec-query'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useAppStateSnapshot } from 'state/app-state'
import { navigateToSection } from './Content/Content.utils'
import { DOCS_RESOURCE_CONTENT } from './ProjectAPIDocs.constants'

const SecondLevelNav = () => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()
  const [open, setOpen] = useState(false)

  const { data } = useOpenAPISpecQuery({ projectRef: ref })
  const tables = data?.tables ?? []
  const functions = data?.functions ?? []
  const [section, resource] = snap.activeDocsSection

  const { data: buckets } = useBucketsQuery({ projectRef: ref })
  const { data: edgeFunctions } = useEdgeFunctionsQuery({ projectRef: ref })
  const bucket = (buckets ?? []).find((b) => b.name === resource)

  const content: { [key: string]: { title: string; options: any[]; docsUrl: string } } = {
    entities: {
      title: 'Tables & Views',
      options: tables,
      docsUrl: 'https://supabase.com/docs/reference/javascript/select',
    },
    'stored-procedures': {
      title: 'Stored Procedures',
      options: functions,
      docsUrl: 'https://supabase.com/docs/reference/javascript/rpc',
    },
    storage: {
      title: 'Storage',
      options: buckets ?? [],
      docsUrl: 'https://supabase.com/docs/reference/javascript/storage-createbucket',
    },
    'edge-functions': {
      title: 'Edge Functions',
      options: edgeFunctions ?? [],
      docsUrl: 'https://supabase.com/docs/reference/javascript/functions-invoke',
    },
  }

  const updateSection = (value: string) => {
    snap.setActiveDocsSection([snap.activeDocsSection[0], value])
    setOpen(false)
  }

  const menuItems = Object.values(DOCS_RESOURCE_CONTENT).filter(
    (content) => content.category === snap.activeDocsSection[0]
  )

  return (
    <div className="py-4 space-y-2">
      <div className="px-2 flex items-center space-x-2">
        <Button
          type="text"
          icon={<IconChevronLeft />}
          className="px-1"
          onClick={() => snap.setActiveDocsSection([snap.activeDocsSection[0]])}
        />
        <p className="text-sm text-foreground-light capitalize">{content[section].title}</p>
      </div>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <div className="px-2">
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
          </div>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
          <Command_Shadcn_>
            <CommandList_Shadcn_>
              <CommandGroup_Shadcn_>
                {content[section].options.map((option) => (
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

      <div className="px-2 space-y-2 py-2">
        {menuItems.map((item) => {
          if (section === 'storage' && bucket !== undefined) {
            if (
              (!bucket.public && item.key === 'retrieve-public-url') ||
              (bucket.public && item.key === 'create-signed-url')
            )
              return null
          }
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

      <div className="px-4 py-4 border-t space-y-2">
        <Alert_Shadcn_ className="p-3">
          <AlertTitle_Shadcn_>
            <p className="text-xs">Unable to find what you're looking for?</p>
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_ className="space-y-1">
            <p className="text-xs !leading-normal">
              The API methods shown here are only the commonly used ones to get you started building
              quickly.
            </p>
            <p className="text-xs !leading-normal">
              Head over to our docs site for the full API documentation.
            </p>
            <Link passHref href={content[section].docsUrl}>
              <Button
                asChild
                className="!mt-2"
                size="tiny"
                type="default"
                icon={<IconExternalLink strokeWidth={1.5} />}
              >
                <a>Documentation</a>
              </Button>
            </Link>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      </div>
    </div>
  )
}

export default SecondLevelNav
