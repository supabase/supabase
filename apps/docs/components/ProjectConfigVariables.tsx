import { useEffect, useMemo, useState } from 'react'
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
import { useIsLoggedIn, useIsUserLoading } from 'common'
import { ProjectsData, useProjectsQuery } from '~/lib/fetch/projects'
import { OrganizationsData, useOrganizationsQuery } from '~/lib/fetch/organizations'
import { BranchesData, useAllProjectsBranchesQuery } from '~/lib/fetch/branches'
import { useProjectApiQuery } from '~/lib/fetch/projectApi'
import { useOnLogout } from '~/lib/userAuth'

interface InstanceData {
  organization: OrganizationsData[number] | null
  project: ProjectsData[number]
  branch?: BranchesData[number]
}

type InstanceKey = readonly [string | null, string, string | null]

function toInstanceKey(instance: InstanceData | null) {
  if (!instance) return null

  return [
    instance.organization?.id ?? null,
    // @ts-ignore -- problem with OpenAPI spec that codegen reads from
    instance.project.ref as string,
    instance.branch?.id ?? null,
  ] satisfies InstanceKey
}

function getInstanceDataFromKey(validInstances: InstanceData[], instanceKey: InstanceKey | null) {
  if (!instanceKey || instanceKey[0] === null) return null

  return (
    validInstances.find(
      (instance) =>
        instance.organization?.id === instanceKey[0] &&
        // @ts-ignore -- problem with OpenAPI spec that codegen reads from
        instance.project.ref === instanceKey[1] &&
        (instanceKey[2] === null || instance.branch?.id === instanceKey[2])
    ) ?? null
  )
}

function toStoredString(instanceKey: InstanceKey | null) {
  return JSON.stringify(instanceKey)
}

function fromStoredString(maybeInstanceKey: string) {
  try {
    return JSON.parse(maybeInstanceKey)
  } catch {
    return null
  }
}

function toPrettyString(instance: InstanceData | null) {
  if (!instance) return ''

  const { organization, project, branch = null } = instance
  return `${organization ? `${organization.name} / ` : ''}${project.name}${
    branch ? ` / ${branch.name}` : ''
  }`
}

/**
 * The Command component uses the `value` for both search matching and selection.
 * Because the two are conflated, the value must contain both:
 * 1. The organization/project/branch refs, for uniquely identifying the project
 * 2. The organization/project/branch name, so combobox search works as expected.
 */
function toCommandValue(instance: InstanceData) {
  const instanceKey = toInstanceKey(instance)
  const prettyString = toPrettyString(instance)
  return JSON.stringify([instanceKey, prettyString])
}

function getKeyFromCommandValue(maybeInstance: string) {
  try {
    const instance = JSON.parse(maybeInstance)
    // For maximum safety, should check that the structure matches rather than casting,
    // but we can avoid that complexity as long as this is only ever used to decode
    // values encoded by `toCommandValue`
    return instance[0] as InstanceKey
  } catch {
    console.error('Failed to parse instance key from command value:', maybeInstance)
    return null
  }
}

const instanceStore = proxy({
  selectedInstanceKey: null as InstanceKey | null,
  setSelectedInstanceKey: (instanceKey: InstanceKey | null) => {
    instanceStore.selectedInstanceKey = instanceKey
    if (instanceKey !== null) {
      store('local', LOCAL_STORAGE_KEYS.SAVED_ORG_PROJECT_BRANCH, toStoredString(instanceKey))
    }
  },
  clear: () => {
    instanceStore.setSelectedInstanceKey(null)
  },
})

type Variable = 'url' | 'anonKey'

const prettyFormatVariable: Record<Variable, string> = {
  url: 'Project URL',
  anonKey: 'Anon key',
}

type ProjectConfigVariablesState =
  | 'userLoading'
  | 'loggedOut'
  | 'loggedIn.dataPending'
  | 'loggedIn.hasData'
  | 'loggedIn.hasNoData'
  | 'loggedIn.dataError'

type ProjectConfigVariablesPlusApiState =
  | Omit<ProjectConfigVariablesState, 'loggedIn.hasData'>
  | 'loggedIn.hasData.apiDataPending'
  | 'loggedIn.hasData.apiDataSuccess'
  | 'loggedIn.hasData.apiDataError'

function ComboBox({
  parentStateSummary,
  instances,
  className,
}: {
  parentStateSummary: ProjectConfigVariablesState
  instances: InstanceData[]
  className?: string
}) {
  const { selectedInstanceKey, setSelectedInstanceKey } = useSnapshot(instanceStore)
  const selectedInstance = getInstanceDataFromKey(instances, selectedInstanceKey)

  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn('flex items-center', className)}>
        <PopoverTrigger asChild aria-label={`Select project`}>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="overflow-hidden h-auto min-h-10 flex justify-between border-none px-1 text-left"
          >
            {parentStateSummary === 'userLoading' || parentStateSummary === 'loggedIn.dataPending'
              ? 'Loading...'
              : toPrettyString(selectedInstance) || 'Select a project...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="z-[999999] p-0" side="bottom">
        <Command>
          <CommandInput placeholder="Search project..." className="border-none ring-0" />
          <CommandEmpty>No project found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className={instances.length > 10 ? 'h-[280px]' : ''}>
              {instances.map((instance) => (
                <CommandItem
                  key={toStoredString(toInstanceKey(instance))}
                  value={toCommandValue(instance)}
                  onSelect={(selectedValue: string) => {
                    const instanceKey = getKeyFromCommandValue(selectedValue)
                    setSelectedInstanceKey(instanceKey)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      instance === selectedInstance ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {toPrettyString(instance)}
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

function ProjectConfigVariablesView({
  parentStateSummary,
  variable,
  instances,
}: {
  parentStateSummary: ProjectConfigVariablesState
  variable: Variable
  instances: InstanceData[]
}) {
  const isLoggedIn = useIsLoggedIn()
  const { selectedInstanceKey } = useSnapshot(instanceStore)

  const selectedInstance = getInstanceDataFromKey(instances, selectedInstanceKey)
  const projectRef = selectedInstance?.branch
    ? selectedInstance?.branch?.project_ref
    : // @ts-ignore -- problem with OpenAPI spec that codegen reads from
      selectedInstance?.project.ref
  const {
    data: apiData,
    isPending: apiIsPending,
    isSuccess: apiIsSuccess,
  } = useProjectApiQuery(
    {
      projectRef,
    },
    { enabled: isLoggedIn && !!projectRef }
  )

  const { copied, handleCopy } = useCopy()

  const apiStateSummary: ProjectConfigVariablesPlusApiState =
    parentStateSummary !== 'loggedIn.hasData'
      ? parentStateSummary
      : apiIsPending
      ? 'loggedIn.hasData.apiDataPending'
      : apiIsSuccess
      ? 'loggedIn.hasData.apiDataSuccess'
      : 'loggedIn.hasData.apiDataError'

  let variableValue: string = null
  if (apiIsSuccess) {
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
    <div className="max-w-[min(100%, 500px)] my-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="grow-[100]">{prettyFormatVariable[variable]}</span>
        {(parentStateSummary === 'userLoading' ||
          parentStateSummary === 'loggedIn.dataPending' ||
          parentStateSummary === 'loggedIn.hasData') && (
          <div className="flex items-center justify-between grow max-w-full gap-2">
            <ComboBox parentStateSummary={parentStateSummary} instances={instances} />
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
        )}
      </div>
      <Input
        disabled
        type="text"
        className="font-mono"
        value={
          apiStateSummary === 'userLoading' ||
          apiStateSummary === 'loggedIn.dataPending' ||
          apiStateSummary === 'loggedIn.hasData.apiDataPending'
            ? 'Loading...'
            : apiStateSummary === 'loggedIn.hasData.apiDataSuccess'
            ? variableValue
            : `YOUR ${prettyFormatVariable[variable].toUpperCase()}`
        }
      />
      {parentStateSummary === 'loggedOut' && (
        <p className="text-foreground-muted text-sm mt-2 mb-0 ml-1">
          There was a problem getting your {prettyFormatVariable[variable]}. Are you{' '}
          <Link
            className="text-foreground-muted"
            href="https://supabase.com/dashboard"
            rel="noreferrer noopener"
            target="_blank"
          >
            logged in
          </Link>
          ?
        </p>
      )}
      {(parentStateSummary === 'loggedIn.hasNoData' ||
        parentStateSummary === 'loggedIn.dataError' ||
        apiStateSummary === 'loggedIn.hasData.apiDataError') && (
        <>
          <p className="text-foreground-muted text-sm mt-2 mb-0 ml-1">
            There was a problem getting your {prettyFormatVariable[variable]}.{' '}
            {parentStateSummary === 'loggedIn.hasNoData' && (
              <>
                Do you have{' '}
                <Link
                  className="text-foreground-muted"
                  href="https://supabase.com/dashboard"
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  any projects
                </Link>
                ?
              </>
            )}
          </p>
          {(parentStateSummary === 'loggedIn.dataError' ||
            apiStateSummary === 'loggedIn.hasData.apiDataError') && (
            <p className="text-foreground-muted text-sm mt-0 ml-1">
              You can also try looking up the value in the{' '}
              <Link
                className="text-foreground-muted"
                href="https://supabase.com/dashboard/project/_/settings/api"
                rel="noreferrer noopener"
                target="_blank"
              >
                dashboard
              </Link>
              .
            </p>
          )}
        </>
      )}
    </div>
  )
}

export function ProjectConfigVariables({ variable }: { variable: Variable }) {
  const isUserLoading = useIsUserLoading()
  const isLoggedIn = useIsLoggedIn()

  const {
    selectedInstanceKey,
    setSelectedInstanceKey,
    clear: clearSharedStoreData,
  } = useSnapshot(instanceStore)
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
  const {
    data: branches,
    isPending: branchesIsPending,
    isError: branchesIsError,
  } = useAllProjectsBranchesQuery({ enabled: isLoggedIn })

  const anyIsPending = organizationsIsPending || projectsIsPending || branchesIsPending
  const anyIsError = organizationsIsError || projectsIsError || branchesIsError

  const stateSummary: ProjectConfigVariablesState = isUserLoading
    ? 'userLoading'
    : !isLoggedIn
    ? 'loggedOut'
    : anyIsPending
    ? 'loggedIn.dataPending'
    : anyIsError
    ? 'loggedIn.dataError'
    : projects.length === 0
    ? 'loggedIn.hasNoData'
    : 'loggedIn.hasData'

  useOnLogout(clearSharedStoreData)

  const formattedData: InstanceData[] = useMemo(
    () =>
      stateSummary !== 'loggedIn.hasData'
        ? []
        : projects.flatMap((project) => {
            const organization =
              organizations.find((organization) => organization.id === project.organization_id) ??
              null

            // @ts-ignore -- problem with OpenAPI spec that codegen reads from
            if (!project.is_branch_enabled) {
              return { organization, project }
            }

            // @ts-ignore -- problem with OpenAPI spec that codegen reads from
            const projectBranches = branches[project.ref]
            if (!projectBranches) {
              return { organization, project }
            }

            return projectBranches.map((branch) => ({ organization, project, branch }))
          }),
    [branches, organizations, projects, stateSummary]
  )

  useEffect(() => {
    if (!selectedInstanceKey && typeof window !== undefined) {
      let storedInstanceKey: InstanceKey = null
      const storedMaybeInstanceKey = retrieve('local', LOCAL_STORAGE_KEYS.SAVED_ORG_PROJECT_BRANCH)
      if (storedMaybeInstanceKey) {
        storedInstanceKey = fromStoredString(storedMaybeInstanceKey)
      }
      setSelectedInstanceKey(storedInstanceKey ?? toInstanceKey(formattedData[0]) ?? null)
    }
  }, [selectedInstanceKey, setSelectedInstanceKey, formattedData])

  return (
    <ProjectConfigVariablesView
      variable={variable}
      instances={formattedData}
      parentStateSummary={stateSummary}
    />
  )
}
