'use client'

import type {
  Branch,
  Org,
  Project,
  Variable,
} from '~/components/ProjectConfigVariables/ProjectConfigVariables.utils'
import type { ProjectApiData } from '~/lib/fetch/projectApi'

import { Check, Copy } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { withErrorBoundary } from 'react-error-boundary'
import { proxy, useSnapshot } from 'valtio'

import { LOCAL_STORAGE_KEYS, useIsLoggedIn, useIsUserLoading } from 'common'
import { Button_Shadcn_ as Button, cn, Input_Shadcn_ as Input } from 'ui'

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
import { type SupavisorConfigData, useSupavisorConfigQuery } from '~/lib/fetch/pooler'
import { useProjectApiQuery } from '~/lib/fetch/projectApi'
import { isProjectPaused, useProjectsQuery } from '~/lib/fetch/projects'
import { retrieve, storeOrRemoveNull } from '~/lib/storage'
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
  | 'loggedIn.selectedProject.projectPaused'
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
      stateSummary !== 'loggedIn.dataSuccess.hasData'
        ? []
        : (projects!
            .map((project) => {
              const organization = organizations!.find((org) => org.id === project.organization_id)!
              return {
                id: project.ref,
                value: toOrgProjectValue(organization, project),
                displayName: toDisplayNameOrgProject(organization, project),
              }
            })
            .filter(Boolean) as ComboBoxOption[]),
    [organizations, projects, stateSummary]
  )

  useEffect(() => {
    if (stateSummary === 'loggedIn.dataSuccess.hasData' && (!selectedOrg || !selectedProject)) {
      const storedMaybeOrgId = retrieve('local', LOCAL_STORAGE_KEYS.SAVED_ORG)
      const storedMaybeProjectRef = retrieve('local', LOCAL_STORAGE_KEYS.SAVED_PROJECT)

      let storedOrg: Org | undefined
      let storedProject: Project | undefined
      if (storedMaybeOrgId && storedMaybeProjectRef) {
        storedOrg = organizations!.find((org) => org.id === Number(storedMaybeOrgId))
        storedProject = projects!.find((project) => project.ref === storedMaybeProjectRef)
      }

      if (storedOrg && storedProject && storedProject.organization_id === storedOrg.id) {
        setSelectedOrgProject(storedOrg, storedProject)
      } else if (projects!.length > 0) {
        const firstProject = projects![0]
        const matchingOrg = organizations!.find((org) => org.id === firstProject.organization_id)
        if (matchingOrg) setSelectedOrgProject(matchingOrg, firstProject)
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
      onSelectOption={(optionValue) => {
        const [orgId, projectRef] = fromOrgProjectValue(optionValue)
        if (!orgId || !projectRef) return

        const org = organizations?.find((org) => org.id === orgId)
        const project = projects?.find((project) => project.ref === projectRef)

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

  const projectPaused = isProjectPaused(selectedProject)
  const hasBranches = selectedProject?.is_branch_enabled ?? false

  const { data, isPending, isError } = useBranchesQuery(
    { projectRef: selectedProject?.ref },
    { enabled: isLoggedIn && !projectPaused && hasBranches }
  )

  const stateSummary: BranchesDataState = userLoading
    ? 'userLoading'
    : !isLoggedIn
      ? 'loggedOut'
      : !hasBranches || projectPaused
        ? 'loggedIn.noBranches'
        : isPending
          ? 'loggedIn.branches.dataPending'
          : isError
            ? 'loggedIn.branches.dataError'
            : data.length === 0
              ? 'loggedIn.branches.dataSuccess.noData'
              : 'loggedIn.branches.dataSuccess.hasData'

  const formattedData: ComboBoxOption[] =
    stateSummary !== 'loggedIn.branches.dataSuccess.hasData'
      ? []
      : data!.map((branch) => ({
          id: branch.id,
          displayName: branch.name,
          value: toBranchValue(branch),
        }))

  useEffect(() => {
    if (stateSummary === 'loggedIn.branches.dataSuccess.hasData' && !selectedBranch) {
      const storedMaybeBranchId = retrieve('local', LOCAL_STORAGE_KEYS.SAVED_BRANCH)

      let storedBranch: Branch | undefined
      if (storedMaybeBranchId) {
        storedBranch = data!.find((branch) => branch.id === storedMaybeBranchId)
      }

      if (storedBranch) {
        setSelectedBranch(storedBranch)
      } else {
        const productionBranch = data!.find(
          (branch) => branch.project_ref === branch.parent_project_ref
        )
        setSelectedBranch(productionBranch ?? data![0])
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
        const [branchId] = fromBranchValue(option)
        if (branchId) {
          const branch = data?.find((branch) => branch.id === branchId)
          if (branch) setSelectedBranch(branch)
        }
      }}
    />
  ) : null
}

function VariableView({ variable, className }: { variable: Variable; className?: string }) {
  const isUserLoading = useIsUserLoading()
  const isLoggedIn = useIsLoggedIn()

  const { selectedProject, selectedBranch } = useSnapshot(projectsStore)
  const projectPaused = isProjectPaused(selectedProject)
  const hasBranches = selectedProject?.is_branch_enabled ?? false
  const ref = hasBranches ? selectedBranch?.project_ref : selectedProject?.ref

  const needsApiQuery = variable === 'publishableKey' || variable === 'url'
  const needsSupavisorQuery = variable === 'sessionPooler'

  const {
    data: apiData,
    isPending: isApiPending,
    isError: isApiError,
  } = useProjectApiQuery(
    {
      projectRef: ref,
    },
    { enabled: isLoggedIn && !!ref && !projectPaused && needsApiQuery }
  )

  const {
    data: supavisorConfig,
    isPending: isSupavisorPending,
    isError: isSupavisorError,
  } = useSupavisorConfigQuery(
    {
      projectRef: ref,
    },
    { enabled: isLoggedIn && !!ref && !projectPaused && needsSupavisorQuery }
  )

  function isInvalidApiData(apiData: ProjectApiData) {
    switch (variable) {
      case 'url':
        return !apiData.app_config?.endpoint
      case 'publishableKey':
        return !apiData.service_api_keys?.some((key) => key.tags === 'anon')
    }
  }

  function isInvalidSupavisorData(supavisorData: SupavisorConfigData) {
    return supavisorData.length === 0
  }

  const stateSummary: VariableDataState = isUserLoading
    ? 'userLoading'
    : !isLoggedIn
      ? 'loggedOut'
      : !ref
        ? 'loggedIn.noSelectedProject'
        : projectPaused
          ? 'loggedIn.selectedProject.projectPaused'
          : (needsApiQuery ? isApiPending : isSupavisorPending)
            ? 'loggedIn.selectedProject.dataPending'
            : (
                  needsApiQuery
                    ? isApiError || isInvalidApiData(apiData!)
                    : isSupavisorError || isInvalidSupavisorData(supavisorConfig!)
                )
              ? 'loggedIn.selectedProject.dataError'
              : 'loggedIn.selectedProject.dataSuccess'

  let variableValue: string = ''
  if (stateSummary === 'loggedIn.selectedProject.dataSuccess') {
    switch (variable) {
      case 'url':
        variableValue = `https://${apiData?.app_config?.endpoint}`
        break
      case 'publishableKey':
        variableValue = apiData?.service_api_keys?.find((key) => key.tags === 'anon')?.api_key || ''
        break
      case 'sessionPooler':
        variableValue = supavisorConfig?.[0]?.connection_string || ''
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
              : stateSummary === 'loggedIn.selectedProject.projectPaused'
                ? 'PROJECT PAUSED'
                : stateSummary === 'loggedIn.selectedProject.dataSuccess'
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
