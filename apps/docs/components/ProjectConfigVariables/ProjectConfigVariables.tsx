import { useIsLoggedIn, useIsUserLoading } from 'common'
import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { withErrorBoundary } from 'react-error-boundary'
import { Button_Shadcn_ as Button, Input_Shadcn_ as Input, cn, IconCopy, IconCheck } from 'ui'
import { proxy, useSnapshot } from 'valtio'

import { useCopy } from '~/hooks/useCopy'
import { useBranchesQuery } from '~/lib/fetch/branches'
import { useOrganizationsQuery } from '~/lib/fetch/organizations'
import { useProjectApiQuery } from '~/lib/fetch/projectApi'
import { useProjectsQuery } from '~/lib/fetch/projects'
import { LOCAL_STORAGE_KEYS, retrieve, storeOrRemoveNull } from '~/lib/storage'
import { useOnLogout } from '~/lib/userAuth'

import { ComboBox, ComboBoxOption } from './ProjectConfigVariables.ComboBox'
import {
  type Branch,
  type Org,
  type Project,
  type Variable,
  fromBranchValue,
  fromOrgProjectValue,
  prettyFormatVariable,
  toBranchValue,
  toDisplayNameOrgProject,
  toOrgProjectValue,
} from './ProjectConfigVariables.utils'

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
    // @ts-ignore -- problem in OpenAPI spec -- project has ref property
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

  useEffect(() => {
    if (stateSummary === 'loggedIn.dataSuccess.hasData' && (!selectedOrg || !selectedProject)) {
      const storedMaybeOrgId = retrieve('local', LOCAL_STORAGE_KEYS.SAVED_ORG)
      const storedMaybeProjectRef = retrieve('local', LOCAL_STORAGE_KEYS.SAVED_PROJECT)

      let storedOrg: Org
      let storedProject: Project
      if (storedMaybeOrgId && storedMaybeProjectRef) {
        // @ts-ignore -- problem in OpenAPI spec -- org id is returned as number, not string
        storedOrg = organizations.find((org) => org.id === Number(storedMaybeOrgId))
        // @ts-ignore -- problem in OpenAPI spec -- project has ref property
        storedProject = projects.find((project) => project.ref === storedMaybeProjectRef)
      }

      if (storedOrg && storedProject && storedProject.organization_id === storedOrg.id) {
        setSelectedOrgProject(storedOrg, storedProject)
      } else {
        const firstProject = projects[0]
        const matchingOrg = organizations.find((org) => org.id === firstProject.organization_id)
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
  const userLoading = useIsUserLoading()
  const isLoggedIn = useIsLoggedIn()

  const { selectedProject, selectedBranch, setSelectedBranch } = useSnapshot(projectsStore)

  // @ts-ignore -- problem in OpenAPI spec -- project has is_branch_enabled property
  const hasBranches = selectedProject?.is_branch_enabled ?? false

  const { data, isPending, isError } = useBranchesQuery(
    // @ts-ignore -- problem in OpenAPI spec -- project has ref property
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
    stateSummary !== 'loggedIn.branches.dataSuccess.hasData'
      ? []
      : data.map((branch) => ({
          id: branch.id,
          displayName: branch.name,
          value: toBranchValue(branch),
        }))

  useEffect(() => {
    if (stateSummary === 'loggedIn.branches.dataSuccess.hasData' && !selectedBranch) {
      const storedMaybeBranchId = retrieve('local', LOCAL_STORAGE_KEYS.SAVED_BRANCH)

      let storedBranch: Branch
      if (storedMaybeBranchId) {
        storedBranch = data.find((branch) => branch.id === storedMaybeBranchId)
      }

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
  const isUserLoading = useIsUserLoading()
  const isLoggedIn = useIsLoggedIn()

  const { selectedProject, selectedBranch } = useSnapshot(projectsStore)

  // @ts-ignore -- problem in OpenAPI spec -- project has is_branch-enabled property
  const hasBranches = selectedProject?.is_branch_enabled ?? false
  // @ts-ignore -- problem in OpenAPI spec -- project has ref property
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

  const stateSummary: VariableDataState = isUserLoading
    ? 'userLoading'
    : !isLoggedIn
      ? 'loggedOut'
      : !ref
        ? 'loggedIn.noSelectedProject'
        : isPending
          ? 'loggedIn.selectedProject.dataPending'
          : isError
            ? 'loggedIn.selectedProject.dataError'
            : 'loggedIn.selectedProject.dataSuccess'

  let variableValue: string = null
  if (stateSummary === 'loggedIn.selectedProject.dataSuccess') {
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
            {copied ? <IconCheck /> : <IconCopy />}
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
