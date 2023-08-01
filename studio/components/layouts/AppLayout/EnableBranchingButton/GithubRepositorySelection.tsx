import clsx from 'clsx'
import Link from 'next/link'
import { useRef, useState } from 'react'
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
  IconChevronDown,
  IconGitHub,
  Modal,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

import { useParams } from 'common'
import { EmptyIntegrationConnection } from 'components/interfaces/Integrations/IntegrationPanels'
import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useGithubBranchesQuery } from 'data/integrations/integrations-github-branches-query'
import { Integration } from 'data/integrations/integrations.types'

interface GithubRepositorySelectionProps {
  integration?: Integration
  selectedBranch?: string
  setSelectedBranch: (name: string) => void
  onSelectConnectRepo: () => void
}

// [Joshen TODO] Integrate the Github repo selector

const GithubRepositorySelection = ({
  integration,
  selectedBranch,
  setSelectedBranch,
  onSelectConnectRepo,
}: GithubRepositorySelectionProps) => {
  const { ref } = useParams()
  const [open, setOpen] = useState(false)
  const comboBoxRef = useRef<HTMLButtonElement>(null)

  const githubProjectIntegration = integration?.connections.find(
    (connection) => connection.supabase_project_ref === ref
  )
  const [repoOwner, repoName] = githubProjectIntegration?.metadata.name.split('/') ?? []

  const {
    data: githubBranches,
    error: githubBranchesError,
    isLoading: isLoadingBranches,
    isSuccess: isSuccessBranches,
    isError: isErrorBranches,
  } = useGithubBranchesQuery({
    organizationIntegrationId: integration?.id,
    repoOwner,
    repoName,
  })

  return (
    <div className={clsx('border-t border-b', !integration ? 'border-amber-300 bg-amber-100' : '')}>
      <Modal.Content>
        <div className="space-y-1 py-6">
          <div className="flex items-center space-x-2">
            <p>Git Connection</p>
            <Badge color="amber">Required</Badge>
          </div>
          <p className="text-sm text-light !mb-4">
            {githubProjectIntegration !== undefined
              ? 'Your database preview branches will be based on the branches in the following repository that your project is connected with:'
              : 'Your database preview branches will be based on the branches in the Git repository that your project is connected with.'}
          </p>
          {!integration && (
            <Link passHref href="/">
              <a target="_blank" rel="noreferrer">
                <Button type="default" className="!mt-3">
                  Install Github Integration
                </Button>
              </a>
            </Link>
          )}
          {integration && !githubProjectIntegration && (
            <EmptyIntegrationConnection onClick={() => onSelectConnectRepo()} />
          )}
          {integration && githubProjectIntegration && (
            <>
              <div className="border bg-surface-200 rounded-md flex items-center justify-between py-4 px-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center bg-scale-100">
                    <IconGitHub strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm text-light">@{repoOwner}</p>
                    <p className="text-sm">{repoName}</p>
                  </div>
                </div>
                <Button type="default" onClick={() => onSelectConnectRepo()}>
                  Configure
                </Button>
              </div>
              <div className="!mt-4">
                <p className="text-sm text-light mb-2">Select your production branch:</p>
                {isLoadingBranches && <ShimmeringLoader />}
                {isErrorBranches && (
                  <AlertError
                    error={githubBranchesError}
                    subject="Failed to retrieve Github branches"
                  />
                )}
                {isSuccessBranches && (
                  <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
                    <PopoverTrigger_Shadcn_ asChild>
                      <Button
                        block
                        type="default"
                        size="medium"
                        ref={comboBoxRef}
                        className="justify-start"
                        iconRight={
                          <span className="grow flex justify-end">
                            <IconChevronDown className={''} />
                          </span>
                        }
                      >
                        <p className={selectedBranch === undefined ? 'text-light' : 'text'}>
                          {selectedBranch || 'Select a branch'}
                        </p>
                      </Button>
                    </PopoverTrigger_Shadcn_>
                    <PopoverContent_Shadcn_
                      className="p-0"
                      side="bottom"
                      align="start"
                      style={{ width: comboBoxRef.current?.offsetWidth }}
                    >
                      <Command_Shadcn_>
                        <CommandInput_Shadcn_ placeholder="Find branch..." />
                        <CommandList_Shadcn_>
                          <CommandEmpty_Shadcn_>No branches found</CommandEmpty_Shadcn_>
                          <CommandGroup_Shadcn_>
                            {githubBranches?.map((branch) => (
                              <CommandItem_Shadcn_
                                asChild
                                key={branch.name}
                                value={branch.name}
                                className="cursor-pointer w-full flex items-center justify-between"
                                onSelect={() => {
                                  setOpen(false)
                                  setSelectedBranch(branch.name)
                                }}
                                onClick={() => {
                                  setOpen(false)
                                  setSelectedBranch(branch.name)
                                }}
                              >
                                <a>
                                  {branch.name}
                                  {branch.name === selectedBranch && <IconCheck />}
                                </a>
                              </CommandItem_Shadcn_>
                            ))}
                          </CommandGroup_Shadcn_>
                        </CommandList_Shadcn_>
                      </Command_Shadcn_>
                    </PopoverContent_Shadcn_>
                  </Popover_Shadcn_>
                )}
              </div>
            </>
          )}
        </div>
      </Modal.Content>
    </div>
  )
}

export default GithubRepositorySelection
