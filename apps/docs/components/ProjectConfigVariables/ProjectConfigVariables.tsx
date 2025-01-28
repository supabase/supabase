'use client'

import type {
  Branch,
  Org,
  Project,
  Variable,
} from '~/components/ProjectConfigVariables/ProjectConfigVariables.utils'
import type { ProjectApiData } from '~/lib/fetch/projectApi'

import { Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { withErrorBoundary } from 'react-error-boundary'
import { proxy, useSnapshot } from 'valtio'

import { useIsLoggedIn, useIsUserLoading } from 'common'
import { Button_Shadcn_ as Button, Input_Shadcn_ as Input, cn } from 'ui'

import {
  ComboBox,
  ComboBoxOption,
} from '~/components/ProjectConfigVariables/ProjectConfigVariables.ComboBox'
import {
  fromBranchValue,
  fromOrgProjectValue,
  prettyFormatVariable,
  toBranchValue,
  toDisplayNameOrgProject,
  toOrgProjectValue,
} from '~/components/ProjectConfigVariables/ProjectConfigVariables.utils'
import { useCopy } from '~/hooks/useCopy'
import { useBranchesQuery } from '~/lib/fetch/branches'
import { useOrganizationsQuery } from '~/lib/fetch/organizations'
import { useProjectApiQuery } from '~/lib/fetch/projectApi'
import { useProjectsQuery } from '~/lib/fetch/projects'
import { LOCAL_STORAGE_KEYS, retrieve, storeOrRemoveNull } from '~/lib/storage'
import { useOnLogout } from '~/lib/userAuth'

type ProjectOrgDataState =
  | 'userLoading'
  | 'loggedOut'
  | 'loggedIn.dataPending'
  | 'loggedIn.dataError'
  | 'loggedIn.dataSuccess.hasData'
  | 'loggedIn.dataSuccess.hasNoData'

type BranchesDataState =
  | 'userLoading'
  | 'loggedOut'
  | 'loggedIn.noBranches'
  | 'loggedIn.branches.dataPending'
  | 'loggedIn.branches.dataError'
  | 'loggedIn.branches.dataSuccess.hasData'
  | 'loggedIn.branches.dataSuccess.noData'

type VariableDataState =
  | 'userLoading'
  | 'loggedOut'
  | 'loggedIn.noSelectedProject'
  | 'loggedIn.selectedProject.dataPending'
  | 'loggedIn.selectedProject.dataError'
  | 'loggedIn.selectedProject.dataSuccess'

const projectsStore = proxy({
  selectedOrg: null as Org | null,
  selectedProject: null as Project | null,
  setSelectedOrgProject: (org: Org | null, project: Project | null) => {
    projectsStore.selectedOrg = org
    storeOrRemoveNull('local', LOCAL_STORAGE_KEYS.SAVED_ORG, org?.id.toString())

    projectsStore.selectedProject = project
    storeOrRemoveNull('local', LOCAL_STORAGE_KEYS.SAVED_PROJECT, project?.ref)
  },
  selectedBranch: null as Branch | null,
  setSelectedBranch: (branch: Branch | null) => {
    projectsStore.selectedBranch = branch
    storeOrRemoveNull('local', LOCAL_STORAGE_KEYS.SAVED_BRANCH, branch?.id)
  },
  clear: () => {
    projectsStore.setSelectedOrgProject(null, null)
    projectsStore.setSelectedBranch(null)
  },
})

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
      stateSummary !== 'loggedIn.dataSuccess.hasData' || !projects || !organizations
        ? []
        : projects.map((project) => {
            const organization = organizations.find((org) => org.id === project.organization_id)
            if (!organization) return null
            const value = toOrgProjectValue(organization, project)
            const displayName = toDisplayNameOrgProject(organization, project)
            return {
              id: project.ref,
              value,
              displayName,
            }
          }).filter((item): item is ComboBoxOption => 
            item !== null && 
            typeof item.id === 'string' && 
            typeof item.value === 'string' && 
            typeof item.displayName === 'string'
          ),
    [organizations, projects, stateSummary]
  )

  useEffect(() => {
    if (stateSummary === 'loggedIn.dataSuccess.hasData' && (!selectedOrg || !selectedProject)) {
      const storedMaybeOrgId = retrieve('local', LOCAL_STORAGE_KEYS.SAVED_ORG)
      const storedMaybeProjectRef = retrieve('local', LOCAL_STORAGE_KEYS.SAVED_PROJECT)

      let storedOrg: Org | undefined
      let storedProject: Project | undefined
      if (storedMaybeOrgId && storedMaybeProjectRef && organizations && projects) {
        storedOrg = organizations.find((org) => org.id === Number(storedMaybeOrgId))
        storedProject = projects.find((project) => project.ref === storedMaybeProjectRef)
      }

      if (storedOrg && storedProject && projects && organizations && storedProject.organization_id === storedOrg.id) {
        setSelectedOrgProject(storedOrg, storedProject)
      } else {
        if (projects && organizations && projects.length > 0) {
          const firstProject = projects[0]
          const matchingOrg = organizations.find((org) => org.id === firstProject.organization_id)
          if (matchingOrg) setSelectedOrgProject(matchingOrg, firstProject)
        }
      }
    }
  }, [organizations, projects, selectedOrg, selectedProject, setSelectedOrgProject, stateSummary])

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
      onSelectOption={(option) => {
        if (!organizations || !projects) return

        const [orgId, projectRef] = fromOrgProjectValue(option)
        if (!orgId || !projectRef) return

        const org = organizations.find((org) => org.id === Number(orgId))
        const project = projects.find((project) => project.ref === projectRef)

        if (org && project && project.organization_id === org.id) {
          setSelectedOrgProject(org, project)
        }
      }}
    />
  )
}

function BranchSelector() {
  const userLoading = useIsUserLoading()
  const isLoggedIn = useIsLoggedIn()

  const { selectedProject, selectedBranch, setSelectedBranch } = useSnapshot(projectsStore)

  const hasBranches = selectedProject?.is_branch_enabled ?? false

  const { data, isPending, isError } = useBranchesQuery(
    { projectRef: selectedProject?.ref },
    { enabled: isLoggedIn && hasBranches }
  )

  const stateSummary: BranchesDataState = userLoading
    ? 'userLoading'
    : !isLoggedIn
      ? 'loggedOut'
      : !hasBranches
        ? 'loggedIn.noBranches'
        : isPending
          ? 'loggedIn.branches.dataPending'
          : isError
            ? 'loggedIn.branches.dataError'
            : data.length === 0
              ? 'loggedIn.branches.dataSuccess.noData'
              : 'loggedIn.branches.dataSuccess.hasData'

  const formattedData: ComboBoxOption[] =
    stateSummary !== 'loggedIn.branches.dataSuccess.hasData' || !data
      ? []
      : data.map((branch) => ({
          id: branch.id,
          displayName: branch.name,
          value: toBranchValue(branch),
        }))

  useEffect(() => {
    if (stateSummary === 'loggedIn.branches.dataSuccess.hasData' && !selectedBranch && data) {
      const storedMaybeBranchId = retrieve('local', LOCAL_STORAGE_KEYS.SAVED_BRANCH)
      const storedBranch = storedMaybeBranchId 
        ? data.find((branch) => branch.id === storedMaybeBranchId)
        : undefined

      if (storedBranch) {
        setSelectedBranch(storedBranch)
      } else {
        const productionBranch = data.find(
          (branch) => branch.project_ref === branch.parent_project_ref
        )
        setSelectedBranch(productionBranch ?? data[0])
      }
    }
  }, [data, selectedBranch, setSelectedBranch, stateSummary])

  return hasBranches ? (
    <ComboBox
      name="branch"
      isLoading={stateSummary === 'userLoading' || stateSummary === 'loggedIn.branches.dataPending'}
      disabled={
        stateSummary === 'loggedOut' ||
        stateSummary === 'loggedIn.noBranches' ||
        stateSummary === 'loggedIn.branches.dataError' ||
        stateSummary === 'loggedIn.branches.dataSuccess.noData'
      }
      options={formattedData}
      selectedOption={selectedBranch ? toBranchValue(selectedBranch) : undefined}
      onSelectOption={(option) => {
        if (!data) return

        const [branchId] = fromBranchValue(option)
        if (!branchId) return

        const branch = data.find((branch) => branch.id === branchId)
        if (branch) setSelectedBranch(branch)
      }}
    />
  ) : null
}

function VariableView({ variable, className }: { variable: Variable; className?: string }) {
  const isUserLoading = useIsUserLoading()
  const isLoggedIn = useIsLoggedIn()

  const { selectedProject, selectedBranch } = useSnapshot(projectsStore)

  const hasBranches = selectedProject?.is_branch_enabled ?? false
  const ref = hasBranches ? selectedBranch?.project_ref : selectedProject?.ref

  const {
    data: apiData,
    isPending,
    isError,
  } = useProjectApiQuery(
    {
      projectRef: ref,
    },
    { enabled: isLoggedIn && !!ref }
  )

  function isInvalid(apiData: ProjectApiData) {
    switch (variable) {
      case 'url':
        return !apiData.autoApiService.endpoint
      case 'anonKey':
        // If the anon key is not available, the backend may return the string:
        // You're using an older version of Supabase. Create a new project for the latest Auth features.
        return /older version/.test(apiData.autoApiService.defaultApiKey)
    }
  }

  const stateSummary: VariableDataState = isUserLoading
    ? 'userLoading'
    : !isLoggedIn
      ? 'loggedOut'
      : !ref
        ? 'loggedIn.noSelectedProject'
        : isPending
          ? 'loggedIn.selectedProject.dataPending'
          : isError || isInvalid(apiData)
            ? 'loggedIn.selectedProject.dataError'
            : 'loggedIn.selectedProject.dataSuccess'

  let variableValue: string | null = null
  if (stateSummary === 'loggedIn.selectedProject.dataSuccess' && apiData?.autoApiService) {
    const service = apiData.autoApiService
    switch (variable) {
      case 'url':
        variableValue = service.endpoint 
          ? `${service.protocol || 'https'}://${service.endpoint}`
          : null
        break
      case 'anonKey':
        variableValue = service.defaultApiKey ?? null
        break
    }
  }

  const { copied, handleCopy } = useCopy()

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        <Input
          disabled
          type="text"
          className="font-mono"
          value={
            stateSummary === 'userLoading' ||
            stateSummary === 'loggedIn.selectedProject.dataPending'
              ? 'Loading...'
              : stateSummary === 'loggedIn.selectedProject.dataSuccess' && variableValue !== null
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
            {copied ? <Check /> : <Copy />}
          </Button>
        </CopyToClipboard>
      </div>
      {stateSummary === 'loggedIn.selectedProject.dataError' && (
        <p className="text-foreground-muted text-sm mt-2 mb-0 ml-1">
          You can also copy your {prettyFormatVariable[variable]} from the{' '}
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

function ProjectConfigVariablesInternal({ variable }: { variable: Variable }) {
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

export const ProjectConfigVariables = withErrorBoundary(ProjectConfigVariablesInternal, {
  fallback: (
    <p>
      Couldn&apos;t display your API settings. You can get them from the{' '}
      <Link
        href="https://supabase.com/dashboard/project/_/settings/api"
        rel="noreferrer noopener"
        target="_blank"
      >
        dashboard
      </Link>
      .
    </p>
  ),
})
