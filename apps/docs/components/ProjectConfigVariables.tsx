import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import {
  Button_Shadcn_ as Button,
  Popover_Shadcn_ as Popover,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
  PopoverContent_Shadcn_ as PopoverContent,
  Command_Shadcn_ as Command,
  CommandInput_Shadcn_ as CommandInput,
  CommandEmpty_Shadcn_ as CommandEmpty,
  CommandItem_Shadcn_ as CommandItem,
  CommandGroup_Shadcn_ as CommandGroup,
  Input_Shadcn_ as Input,
  cn,
  IconCopy,
  IconCheck,
  ScrollArea,
} from 'ui'
import CopyToClipboard from 'react-copy-to-clipboard'
import { proxy, useSnapshot } from 'valtio'
import { LOCAL_STORAGE_KEYS, retrieve, store } from '~/lib/storage'
import Link from 'next/link'
import { isBrowser, useIsLoggedIn, useIsUserLoading } from 'common'
import { ProjectsData, useProjectsQuery } from '~/lib/fetch/projects'
import { OrganizationsData, useOrganizationsQuery } from '~/lib/fetch/organizations'
import { BranchesData, useBranchesQuery } from '~/lib/fetch/branches'
import { useProjectApiQuery } from '~/lib/fetch/projectApi'
import { useOnLogout } from '~/lib/userAuth'
import { noop } from 'lodash'

type Org = OrganizationsData[number]
type Project = ProjectsData[number]
type Branch = BranchesData[number]

const projectsStore = proxy({
  // Local storage keys are cleared globally at the app level,
  // so don't need to worry about clearing them here.
  selectedOrg: null as Org | null,
  selectedProject: null as Project | null,
  setSelectedOrgProject: (org: Org | null, project: Project | null) => {
    projectsStore.selectedOrg = org
    if (org) store('local', LOCAL_STORAGE_KEYS.SAVED_ORG, org.id)
    projectsStore.selectedProject = project
    // @ts-ignore -- problem in OpenAPI spec -- project has ref property
    if (project) store('local', LOCAL_STORAGE_KEYS.SAVED_PROJECT, project.ref)
  },
  selectedBranch: null as Branch | null,
  setSelectedBranch: (branch: Branch | null) => {
    projectsStore.selectedBranch = branch
    if (branch) store('local', LOCAL_STORAGE_KEYS.SAVED_BRANCH, branch.id)
  },
  clear: () => {
    projectsStore.setSelectedOrgProject(null, null)
    projectsStore.setSelectedBranch(null)
  },
})

type Variable = 'url' | 'anonKey'

const prettyFormatVariable: Record<Variable, string> = {
  url: 'Project URL',
  anonKey: 'Anon key',
}

type ProjectOrgDataState =
  | 'userLoading'
  | 'loggedOut'
  | 'loggedIn.dataPending'
  | 'loggedIn.dataError'
  | 'loggedIn.dataSuccess.hasData'
  | 'loggedIn.dataSuccess.hasNoData'

interface ComboBoxOption {
  id: string
  value: string
  displayName: string
}

function ComboBox<Opt extends ComboBoxOption>({
  isLoading,
  disabled,
  name,
  options,
  selectedOption,
  onSelectOption = noop,
  className,
}: {
  isLoading: boolean
  disabled?: boolean
  name: string
  options: Opt[]
  selectedOption?: string
  onSelectOption?: (newValue: string) => void
  checkEqualsOptions?: (old: string, candidate: string) => boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn('flex items-center', className)}>
        <PopoverTrigger asChild aria-label={`Select ${name}`} disabled={disabled}>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'overflow-hidden',
              'h-auto min-h-10',
              'flex justify-between',
              'border-none',
              'py-0 pl-0 pr-1 text-left'
            )}
          >
            {isLoading
              ? 'Loading...'
              : (selectedOption && fromOrgProjectValue(selectedOption)[2]) ?? 'Select a project...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="z-[999999] p-0" side="bottom">
        <Command>
          <CommandInput placeholder="Search project..." className="border-none ring-0" />
          <CommandEmpty>No project found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className={options.length > 10 ? 'h-[280px]' : ''}>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.value}
                  onSelect={(selectedValue: string) => {
                    setOpen(false)
                    onSelectOption(selectedValue)
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedOption === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.displayName}
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function useCopy() {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1000)
  }

  return { copied, handleCopy }
}

function toDisplayNameOrgProject(org: Org, project: Project) {
  return `${org.name} / ${project.name}`
}

function toOrgProjectValue(org: Org, project: Project) {
  // @ts-ignore -- problem in OpenAPI spec -- project has ref property
  return JSON.stringify([org.id, project.ref, toDisplayNameOrgProject(org, project)])
}

function fromOrgProjectValue(
  maybeOrgProject: string
): [string, string, string] | [null, null, null] {
  try {
    const data = JSON.parse(maybeOrgProject)
    if (!Array.isArray(data) || data.length !== 3) {
      throw Error("Shape of parsed JSON doesn't match form of org and project value")
    }
    return [data[0], data[1], data[2]]
  } catch {
    return [null, null, null]
  }
}

function toBranchValue(branch: Branch) {
  return JSON.stringify([branch.id, branch.name])
}

function fromBranchValue(maybeBranch: string): [string, string] | [null, null] {
  try {
    const data = JSON.parse(maybeBranch)
    if (!Array.isArray(data) || data.length !== 2) {
      throw Error("Shape of parsed JSON doesn't match form of branch value")
    }
    return [data[0], data[1]]
  } catch {
    return [null, null]
  }
}

function OrgProjectSelector() {
  const isUserLoading = useIsUserLoading()
  const isLoggedIn = useIsLoggedIn()

  const { selectedOrg, selectedProject, setSelectedOrgProject } = useSnapshot(projectsStore)

  const {
    data: organizations,
    isPending: organizationsIsPending,
    isError: organizationsIsError,
  } = useOrganizationsQuery({ enabled: isLoggedIn })
  const {
    data: projects,
    isPending: projectsIsPending,
    isError: projectsIsError,
  } = useProjectsQuery({ enabled: isLoggedIn })

  const anyIsPending = organizationsIsPending || projectsIsPending
  const anyIsError = organizationsIsError || projectsIsError

  const stateSummary: ProjectOrgDataState = isUserLoading
    ? 'userLoading'
    : !isLoggedIn
    ? 'loggedOut'
    : anyIsPending
    ? 'loggedIn.dataPending'
    : anyIsError
    ? 'loggedIn.dataError'
    : projects?.length === 0
    ? 'loggedIn.dataSuccess.hasNoData'
    : 'loggedIn.dataSuccess.hasData'

  const formattedData: ComboBoxOption[] = useMemo(
    () =>
      stateSummary !== 'loggedIn.dataSuccess.hasData'
        ? []
        : projects.map((project) => {
            const organization = organizations.find((org) => org.id === project.organization_id)
            return {
              // @ts-ignore -- problem in OpenAPI spec -- project has ref property
              id: project.ref,
              value: toOrgProjectValue(organization, project),
              displayName: toDisplayNameOrgProject(organization, project),
            }
          }),
    [organizations, projects, stateSummary]
  )

  if (
    isBrowser &&
    stateSummary === 'loggedIn.dataSuccess.hasData' &&
    (!selectedOrg || !selectedProject)
  ) {
    const storedMaybeOrgId = retrieve('local', LOCAL_STORAGE_KEYS.SAVED_ORG)
    const storedMaybeProjectRef = retrieve('local', LOCAL_STORAGE_KEYS.SAVED_PROJECT)
    // @ts-ignore -- problem in OpenAPI spec -- org id is returend as number, not string
    const storedOrg = organizations.find((org) => org.id === Number(storedMaybeOrgId))
    // @ts-ignore -- problem in OpenAPI spec -- project has ref property
    const storedProject = projects.find((project) => project.ref === storedMaybeProjectRef)

    if (storedOrg && storedProject && storedProject.organization_id === storedOrg.id) {
      setSelectedOrgProject(storedOrg, storedProject)
    } else {
      const firstProject = projects[0]
      const matchingOrg = organizations.find((org) => org.id === firstProject.organization_id)
      if (matchingOrg) setSelectedOrgProject(matchingOrg, firstProject)
    }
  }

  return (
    <ComboBox
      name="project"
      isLoading={stateSummary === 'userLoading' || stateSummary === 'loggedIn.dataPending'}
      disabled={
        stateSummary === 'loggedOut' ||
        stateSummary === 'loggedIn.dataError' ||
        stateSummary === 'loggedIn.dataSuccess.hasNoData'
      }
      options={formattedData}
      selectedOption={
        selectedOrg && selectedProject ? toOrgProjectValue(selectedOrg, selectedProject) : undefined
      }
      onSelectOption={(optionValue) => {
        const [orgId, projectRef] = fromOrgProjectValue(optionValue)
        if (!orgId || !projectRef) return

        const org = organizations.find((org) => org.id === orgId)
        // @ts-ignore -- problem in OpenAPI spec -- project has ref property
        const project = projects.find((project) => project.ref === projectRef)

        if (org && project && project.organization_id === org.id) {
          setSelectedOrgProject(org, project)
        }
      }}
    />
  )
}

function BranchSelector() {
  const isLoggedIn = useIsLoggedIn()
  const { selectedProject, selectedBranch, setSelectedBranch } = useSnapshot(projectsStore)

  // @ts-ignore -- problem in OpenAPI spec -- project has is_branch_enabled property
  const hasBranches = selectedProject?.is_branch_enabled ?? false
  if (!hasBranches) setSelectedBranch(null)

  const { data, isPending, isSuccess, isError } = useBranchesQuery(
    // @ts-ignore -- problem in OpenAPI spec -- project has ref property
    { projectRef: selectedProject?.ref },
    { enabled: isLoggedIn && hasBranches }
  )

  const formattedData: ComboBoxOption[] =
    !hasBranches || !isSuccess || data.length === 0
      ? []
      : data.map((branch) => ({
          id: branch.id,
          displayName: branch.name,
          value: toBranchValue(branch),
        }))

  if (isBrowser && isSuccess && !selectedBranch) {
    const storedMaybeBranchId = retrieve('local', LOCAL_STORAGE_KEYS.SAVED_BRANCH)
    const storedBranch = data.find((branch) => branch.id === storedMaybeBranchId)

    if (storedBranch) {
      setSelectedBranch(storedBranch)
    } else {
      const productionBranch = data.find(
        (branch) => branch.project_ref === branch.parent_project_ref
      )
      setSelectedBranch(productionBranch ?? data[0])
    }
  }

  return hasBranches ? (
    <ComboBox
      name="branch"
      isLoading={isPending}
      disabled={isError || data.length === 0}
      options={formattedData}
      selectedOption={toBranchValue(selectedBranch)}
      onSelectOption={(option) => {
        const [branchId] = fromBranchValue(option)
        if (branchId) {
          const branch = data.find((branch) => branch.id === branchId)
          if (branch) setSelectedBranch(branch)
        }
      }}
    />
  ) : null
}

function VariableView({ variable, className }: { variable: Variable; className?: string }) {
  const isLoggedIn = useIsLoggedIn()
  const { selectedProject, selectedBranch } = useSnapshot(projectsStore)

  // @ts-ignore -- problem in OpenAPI spec -- project has is_branch-enabled property
  const hasBranches = selectedProject?.is_branch_enabled ?? false
  // @ts-ignore -- problem in OpenAPI spec -- project has ref property
  const ref = hasBranches ? selectedBranch?.project_ref : selectedProject?.ref

  const {
    data: apiData,
    isPending,
    isSuccess,
  } = useProjectApiQuery(
    {
      projectRef: ref,
    },
    { enabled: isLoggedIn && !!ref }
  )

  const { copied, handleCopy } = useCopy()

  let variableValue: string = null
  if (isSuccess) {
    switch (variable) {
      case 'url':
        variableValue = `${apiData.autoApiService.protocol || 'https'}://${
          apiData.autoApiService.endpoint
        }`
        break
      case 'anonKey':
        variableValue = apiData.autoApiService.defaultApiKey
        break
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Input
        disabled
        type="text"
        className="font-mono"
        value={
          isPending
            ? 'Loading...'
            : isSuccess
            ? variableValue
            : `YOUR ${prettyFormatVariable[variable].toUpperCase()}`
        }
      />
      <CopyToClipboard text={variableValue ?? ''}>
        <Button
          disabled={!variableValue}
          variant="ghost"
          className="px-0"
          onClick={handleCopy}
          aria-label="Copy"
        >
          {copied ? <IconCheck /> : <IconCopy />}
        </Button>
      </CopyToClipboard>
    </div>
  )
}

function LoginHint({ variable }: { variable: Variable }) {
  const isUserLoading = useIsUserLoading()
  const isLoggedIn = useIsLoggedIn()

  if (isUserLoading || isLoggedIn) return null

  return (
    <p className="text-foreground-muted text-sm mt-2 mb-0 ml-1">
      To get your {prettyFormatVariable[variable]},{' '}
      <Link
        className="text-foreground-muted"
        href="https://supabase.com/dashboard"
        rel="noreferrer noopener"
        target="_blank"
      >
        log in
      </Link>
      .
    </p>
  )
}

export function ProjectConfigVariables({ variable }: { variable: Variable }) {
  const { clear: clearSharedStoreData } = useSnapshot(projectsStore)
  useOnLogout(clearSharedStoreData)

  return (
    <div className="max-w-[min(100%, 500px)] my-6">
      <h6 className={cn('mt-0 mb-1', 'text-foreground')}>{prettyFormatVariable[variable]}</h6>
      <div className="flex flex-wrap gap-x-6">
        <OrgProjectSelector />
        <BranchSelector />
      </div>
      <VariableView variable={variable} className="mt-1" />
      <LoginHint variable={variable} />
    </div>
  )
}
