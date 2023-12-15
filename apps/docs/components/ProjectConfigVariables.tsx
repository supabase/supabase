import { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
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
} from 'ui'
import CopyToClipboard from 'react-copy-to-clipboard'
import { proxy, useSnapshot } from 'valtio'
import { LOCAL_STORAGE_KEYS, remove, retrieve, store } from '~/lib/storage'
import Link from 'next/link'
import { useIsLoggedIn, useIsUserLoading } from 'common'
import { ProjectsData, invalidateProjectsQuery, useProjectsQuery } from '~/lib/fetch/projects'
import {
  OrganizationsData,
  invalidateOrganizationsQuery,
  useOrganizationsQuery,
} from '~/lib/fetch/organizations'
import { BranchesData, useAllProjectsBranchesQuery } from '~/lib/fetch/branches'
import { invalidateProjectApiQuery, useProjectApiQuery } from '~/lib/fetch/projectApi'
import { useQueryClient } from '@tanstack/react-query'
import { useOnLogout } from '~/lib/userAuth'

interface InstanceData {
  organization: OrganizationsData[number] | null
  project: ProjectsData[number]
  branch?: BranchesData[number]
}

function dehydrateInstance(instance: InstanceData | null) {
  if (!instance) return ''

  return JSON.stringify([
    instance.organization?.id,
    // @ts-ignore -- problem with OpenAPI spec that codegen reads from
    instance.project.ref,
    instance.branch?.id ?? null,
  ])
}

function rehydrateInstance(validInstances: InstanceData[], maybeInstance: string) {
  try {
    const [organizationId, projectRef, branchId] = JSON.parse(maybeInstance)

    if (organizationId === null) return null

    return (
      validInstances.find(
        (instance) =>
          instance.organization?.id === organizationId &&
          // @ts-ignore -- problem with OpenAPI spec that codegen reads from
          instance.project.ref === projectRef &&
          (branchId === null || instance.branch?.id === branchId)
      ) ?? null
    )
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

const instanceStore = proxy({
  selectedInstance: null as InstanceData | null,
  setSelectedInstance: (instance: InstanceData | null) => {
    instanceStore.selectedInstance = instance
    if (instance !== null) {
      store('local', LOCAL_STORAGE_KEYS.SAVED_ORG_PROJECT_BRANCH, dehydrateInstance(instance))
    }
  },
  clear: () => {
    instanceStore.setSelectedInstance(null)
    // Also done centrally in lib/userAuth,
    // but no harm and an extra failsafe in doing it twice
    remove('local', LOCAL_STORAGE_KEYS.SAVED_ORG_PROJECT_BRANCH)
  },
})

type Variable = 'url' | 'anonKey'

const prettyFormatVariable: Record<Variable, string> = {
  url: 'Project URL',
  anonKey: 'Anon key',
}

function ComboBox({
  parentStateSummary,
  variable,
  instances,
  className,
}: {
  parentStateSummary: ProjectConfigVariablesState
  variable: string
  instances: InstanceData[]
  className?: string
}) {
  const { selectedInstance, setSelectedInstance } = useSnapshot(instanceStore)

  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn('flex items-center', className)}>
        <PopoverTrigger asChild aria-label={`Select and copy ${variable}`}>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="overflow-hidden justify-between border-none px-1"
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
            {instances.map((instance) => (
              <CommandItem
                key={dehydrateInstance(instance)}
                value={dehydrateInstance(instance)}
                onSelect={(selectedValue: string) => {
                  const newSelectedInstance = rehydrateInstance(instances, selectedValue)
                  setSelectedInstance(newSelectedInstance)
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
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
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
  const { selectedInstance } = useSnapshot(instanceStore)

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
    { enabled: !!projectRef }
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

  console.log('parentStateSummary', parentStateSummary)
  console.log('apiStateSummary', apiStateSummary)
  console.log('apiData', apiData)

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
    <div
      style={{ '--copy-button-size': '50px' } as CSSProperties}
      className="max-w-[min(100%, 500px)] my-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>{prettyFormatVariable[variable]}</span>
        {(parentStateSummary === 'userLoading' ||
          parentStateSummary === 'loggedIn.dataPending' ||
          parentStateSummary === 'loggedIn.hasData') && (
          <div className="flex justify-between">
            <ComboBox
              parentStateSummary={parentStateSummary}
              variable={variable}
              instances={instances}
            />
            <CopyToClipboard text={variableValue ?? ''}>
              <Button
                disabled={!variableValue}
                variant="ghost"
                className="w-[var(--copy-button-size)]"
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
            href="/dashboard"
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
                  href="/dashboard"
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
                href="/dashboard/project/_/settings/api"
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
    selectedInstance,
    setSelectedInstance,
    clear: clearSharedStoreData,
  } = useSnapshot(instanceStore)
  const queryClient = useQueryClient()
  const {
    data: organizations,
    isPending: organizationsIsPending,
    isError: organizationsIsError,
  } = useOrganizationsQuery()
  const {
    data: projects,
    isPending: projectsIsPending,
    isError: projectsIsError,
  } = useProjectsQuery()
  const {
    data: branches,
    isPending: branchesIsPending,
    isError: branchesIsError,
    invalidate: invalidateAllProjectsBranchesQuery,
  } = useAllProjectsBranchesQuery()

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

  const cleanUp = useCallback(() => {
    // This is a safeguard against display bugs,
    // since the page will keep displaying after the user logs out.
    // This way no data is left to display even if there is a view bug.
    if (stateSummary === 'loggedOut') {
      invalidateProjectsQuery(queryClient)
      invalidateOrganizationsQuery(queryClient)
      invalidateAllProjectsBranchesQuery()
      // @ts-ignore -- problem with OpenAPI spec that codegen reads from
      invalidateProjectApiQuery({ projectRef: selectedInstance?.project.ref }, queryClient)
      clearSharedStoreData()
    }
  }, [
    selectedInstance,
    stateSummary,
    clearSharedStoreData,
    invalidateAllProjectsBranchesQuery,
    queryClient,
  ])
  useOnLogout(cleanUp)

  const formattedData: InstanceData[] = useMemo(
    () =>
      !Array.isArray(projects)
        ? []
        : projects.flatMap((project) => {
            const organization =
              (organizations ?? []).find(
                (organization) => organization.id === project.organization_id
              ) ?? null

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
    [branches, organizations, projects]
  )

  useEffect(() => {
    if (!selectedInstance && typeof window !== undefined) {
      let storedInstance: InstanceData = null
      const dehydratedInstance = retrieve('local', LOCAL_STORAGE_KEYS.SAVED_ORG_PROJECT_BRANCH)
      if (dehydratedInstance) {
        storedInstance = rehydrateInstance(formattedData, dehydratedInstance)
      }
      setSelectedInstance(storedInstance ?? formattedData[0] ?? null)
    }
  }, [selectedInstance, setSelectedInstance, formattedData])

  return (
    <ProjectConfigVariablesView
      variable={variable}
      instances={formattedData}
      parentStateSummary={stateSummary}
    />
  )
}
