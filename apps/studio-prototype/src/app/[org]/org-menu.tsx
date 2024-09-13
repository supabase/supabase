'use client'

import { Org, orgs } from '@/src/config/org'
import { useConfig } from '@/src/hooks/use-config'
import { Check, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  cn,
} from 'ui'

export default function OrgMenu() {
  const [open, setOpenState] = useState(false)
  const [config, setConfig] = useConfig()

  const router = useRouter()

  const { selectedOrg, db } = config

  return (
    <>
      <div className="-space-x-px flex items-center">
        {/* <Button icon={<Boxes strokeWidth={2} />} type="default" className="rounded-r-none"></Button> */}
        <DropdownMenu open={open} onOpenChange={setOpenState}>
          <DropdownMenuTrigger asChild>
            <Button size="tiny" type="default" iconRight={<ChevronsUpDown />} className="pl-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-foreground flex items-center justify-center text-background rounded-md border text-[10px]">
                  {selectedOrg?.name?.slice(0, 2).toUpperCase()}
                </div>
                {config?.selectedOrg?.name}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[320px]"
            side="bottom"
            align="start"
            alignOffset={-4}
            sideOffset={8}
          >
            <div className="p-2 flex gap-3 items-center">
              <div className="w-10 h-10 bg-foreground flex items-center justify-center text-background rounded-md border">
                {selectedOrg?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col gap-0">
                <span className="text-sm text-foreground-light truncate">{selectedOrg?.name}</span>
                <span className="text-xs text-foreground-lighter truncate">
                  {selectedOrg?.projects.length} Projects
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push(`/${selectedOrg?.key}/projects`)}>
              All Projects
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link href={`/${selectedOrg?.key}/settings/general`}>
              <DropdownMenuItem onSelect={() => setOpenState(false)}>
                Organization Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem>Members</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Switch Organization</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {orgs.map((org) => (
                    <Link
                      href={`/${org.key}/projects`}
                      key={org.key}
                      onClick={() => {
                        router.push(`/${org.key}/projects`)
                        setConfig({
                          ...config,
                          selectedOrg: db.orgs.find((o: Org) => o.key === org.key),
                          selectedProject: db?.orgs?.find((o: Org) => o.key === org.key)
                            ?.projects[0],
                          selectedEnv: db?.orgs?.find((o: Org) => o.key === org.key)?.projects[0]
                            .branches[0] ?? {
                            name: 'main',
                            type: 'prod',
                            key: 'main',
                          },
                        })
                        setOpenState(false)
                      }}
                    >
                      <DropdownMenuItem key={org.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-[26px] h-[26px] border bg-foreground rounded-md',
                              'flex items-center justify-center text-background text-xs font-semibold'
                            )}
                          >
                            {org.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="truncate">{org.name}</span>
                        </div>
                        <div
                          className={cn(
                            'w-4 h-4 bg-foreground rounded-full',
                            'flex items-center justify-center',
                            selectedOrg?.key === org.key ? 'opacity-100' : 'opacity-0'
                          )}
                        >
                          <Check className={cn('h-2 w-2 text-background')} strokeWidth={5} />
                        </div>
                      </DropdownMenuItem>
                    </Link>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={() => router.push('/new')}>
              New organization
            </DropdownMenuItem>

            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
