import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import Link from 'next/link'

import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useBranchesQuery } from 'data/branches/branches-query'
import {
  Badge,
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconCheck,
  IconCode,
  IconPlus,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

const BranchDropdown = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const branchNameRef = useRef<HTMLAnchorElement>(null)
  const { data: branches, isLoading, isError, isSuccess } = useBranchesQuery({ projectRef })

  const [open, setOpen] = useState(false)
  const popoverOffset = (branchNameRef.current?.offsetWidth ?? 0) + 12
  const selectedBranch = branches?.find((branch) => branch.project_ref === projectRef)

  const onSwitchBranch = async () => {
    console.log('Fetch branch details and update connection string or something')
  }

  return (
    <>
      {isLoading && <ShimmeringLoader className="w-[90px]" />}

      {isError && <div></div>}

      {isSuccess && branches.length > 0 && (
        <div className="flex items-center space-x-2 px-2">
          <Link passHref href={`/project/${projectRef}/branches`}>
            <a ref={branchNameRef} className="flex items-center space-x-2">
              <p className="text-sm">{selectedBranch?.name}</p>
              {selectedBranch?.is_default && <Badge color="amber">Production</Badge>}
            </a>
          </Link>

          <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger_Shadcn_ asChild>
              <Button
                type="text"
                className="px-1"
                icon={<IconCode className="text-scale-1100 rotate-90" strokeWidth={2} size={12} />}
              />
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_
              className="p-0"
              side="bottom"
              align="start"
              style={{ marginLeft: `-${popoverOffset}px` }}
            >
              <Command_Shadcn_>
                <CommandInput_Shadcn_ placeholder="Find branch..." />
                <CommandList_Shadcn_>
                  <CommandEmpty_Shadcn_>No branches found</CommandEmpty_Shadcn_>
                  <CommandGroup_Shadcn_>
                    {branches?.map((branch) => {
                      const href = {
                        pathname: router.pathname,
                        query: { ...router.query, ref: branch.project_ref },
                      }

                      return (
                        <Link passHref href={href} key={branch.id}>
                          <CommandItem_Shadcn_
                            asChild
                            value={branch.id}
                            className="cursor-pointer w-full flex items-center justify-between"
                            onSelect={() => {
                              setOpen(false)
                              onSwitchBranch()
                              router.push(href)
                            }}
                            onClick={() => {
                              onSwitchBranch()
                              setOpen(false)
                            }}
                          >
                            <a>
                              {branch.name}
                              {branch.id === selectedBranch?.id && <IconCheck />}
                            </a>
                          </CommandItem_Shadcn_>
                        </Link>
                      )
                    })}
                  </CommandGroup_Shadcn_>
                  {/* <CommandGroup_Shadcn_ className="border-t">
                    <Link passHref href={'/'}>
                      <CommandItem_Shadcn_
                        asChild
                        className="cursor-pointer flex items-center space-x-2 w-full"
                        onSelect={(e) => {
                          setOpen(false)
                          router.push('/')
                        }}
                        onClick={() => setOpen(false)}
                      >
                        <a>
                          <IconPlus size={14} strokeWidth={1.5} />
                          <p>New branch</p>
                        </a>
                      </CommandItem_Shadcn_>
                    </Link>
                  </CommandGroup_Shadcn_> */}
                </CommandList_Shadcn_>
              </Command_Shadcn_>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>
        </div>
      )}
    </>
  )
}

export default BranchDropdown
