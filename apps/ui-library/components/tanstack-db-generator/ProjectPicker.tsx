'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { LOCAL_STORAGE_KEYS, useIsLoggedIn, useIsUserLoading } from 'common'
import { useEffect, useMemo, useState } from 'react'

import { ComboBox, type ComboBoxOption } from './ComboBox'
import { fromOrgProjectValue, toDisplayNameOrgProject, toOrgProjectValue, type Org } from './utils'
import { useDebounce } from '@/hooks/useDebounce'
import { organizationsQueryOptions } from '@/lib/fetch/organizations'
import { projectKeysQueryOptions } from '@/lib/fetch/projectApi'
import { projectsInfiniteQueryOptions, type ProjectInfoInfinite } from '@/lib/fetch/projects'
import { retrieve, storeOrRemoveNull } from '@/lib/storage'

interface ProjectPickerProps {
  onProjectResolved: (data: { projectRef: string; anonKey: string } | null) => void
}

export function ProjectPicker({ onProjectResolved }: ProjectPickerProps) {
  const isUserLoading = useIsUserLoading()
  const isLoggedIn = useIsLoggedIn()

  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null)
  const [selectedProject, setSelectedProject] = useState<ProjectInfoInfinite | null>(null)
  const [missingAnonKey, setMissingAnonKey] = useState(false)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const {
    data: organizations,
    isPending: organizationsIsPending,
    isError: organizationsIsError,
  } = useQuery(organizationsQueryOptions({ enabled: isLoggedIn }))

  const {
    data: projectsData,
    isPending: projectsIsPending,
    isError: projectsIsError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    projectsInfiniteQueryOptions(
      { search: search.length === 0 ? search : debouncedSearch },
      { enabled: isLoggedIn }
    )
  )
  const projects = useMemo(
    () => projectsData?.pages.flatMap((page) => page.projects) ?? [],
    [projectsData?.pages]
  )

  const anyIsPending = organizationsIsPending || projectsIsPending
  const anyIsError = organizationsIsError || projectsIsError

  const isReady =
    isLoggedIn && !isUserLoading && !anyIsPending && !anyIsError && projects?.length > 0

  const formattedData: ComboBoxOption[] = useMemo(
    () =>
      !isReady
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
    [organizations, projects, isReady]
  )

  // Auto-select from localStorage or first project
  useEffect(() => {
    if (isReady && (!selectedOrg || !selectedProject)) {
      const storedMaybeOrgId = retrieve('local', LOCAL_STORAGE_KEYS.SAVED_ORG)
      const storedMaybeProjectRef = retrieve('local', LOCAL_STORAGE_KEYS.SAVED_PROJECT)

      let storedOrg: Org | undefined
      let storedProject: ProjectInfoInfinite | undefined
      if (storedMaybeOrgId && storedMaybeProjectRef) {
        storedOrg = organizations!.find((org) => org.id === Number(storedMaybeOrgId))
        storedProject = projects!.find((project) => project.ref === storedMaybeProjectRef)
      }

      if (storedOrg && storedProject && storedProject.organization_id === storedOrg.id) {
        setSelectedOrg(storedOrg)
        setSelectedProject(storedProject)
      } else if (projects!.length > 0) {
        const firstProject = projects![0]
        const matchingOrg = organizations!.find((org) => org.id === firstProject.organization_id)
        if (matchingOrg) {
          setSelectedOrg(matchingOrg)
          setSelectedProject(firstProject)
        }
      }
    }
  }, [organizations, projects, selectedOrg, selectedProject, isReady])

  function handleSelectOrgProject(optionValue: string) {
    const [orgId, projectRef] = fromOrgProjectValue(optionValue)
    if (!orgId || !projectRef) return

    const org = organizations?.find((org) => org.id === orgId)
    const project = projects?.find((project) => project.ref === projectRef)

    if (org && project && project.organization_id === org.id) {
      setSelectedOrg(org)
      setSelectedProject(project)
      storeOrRemoveNull('local', LOCAL_STORAGE_KEYS.SAVED_ORG, org.id.toString())
      storeOrRemoveNull('local', LOCAL_STORAGE_KEYS.SAVED_PROJECT, project.ref)
    }
  }

  // Fetch API keys for the selected project
  const {
    data: apiKeysData,
    isPending: isApiKeysPending,
    isError: isApiKeysError,
  } = useQuery(
    projectKeysQueryOptions(
      { projectRef: selectedProject?.ref },
      { enabled: isLoggedIn && !!selectedProject?.ref }
    )
  )

  // Resolve the key and notify parent
  useEffect(() => {
    if (!selectedProject?.ref || isApiKeysPending || isApiKeysError || !apiKeysData) {
      onProjectResolved(null)
      return
    }

    const anonKey = apiKeysData.find((k) => k.type === 'legacy' && k.name === 'anon')?.api_key

    if (anonKey) {
      setMissingAnonKey(false)
      onProjectResolved({ projectRef: selectedProject.ref, anonKey })
    } else {
      setMissingAnonKey(true)
      onProjectResolved(null)
    }
  }, [selectedProject?.ref, apiKeysData, isApiKeysPending, isApiKeysError, onProjectResolved])

  return (
    <div className="space-y-2">
      <ComboBox
        name="project"
        isLoading={isUserLoading || anyIsPending}
        disabled={!isLoggedIn || anyIsError || (projects?.length === 0 && !anyIsPending)}
        options={formattedData}
        selectedDisplayName={
          selectedOrg && selectedProject
            ? toDisplayNameOrgProject(selectedOrg, selectedProject)
            : undefined
        }
        selectedOption={
          selectedOrg && selectedProject
            ? toOrgProjectValue(selectedOrg, selectedProject)
            : undefined
        }
        onSelectOption={handleSelectOrgProject}
        search={search}
        isFetching={isFetching}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        setSearch={setSearch}
        useCommandSearch={false}
      />
      {isApiKeysPending && selectedProject && (
        <p className="text-xs text-muted-foreground">Loading API keys...</p>
      )}
      {isApiKeysError && selectedProject && (
        <p className="text-xs text-destructive">Failed to load API keys for this project.</p>
      )}
      {missingAnonKey && selectedProject && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          This project does not have an anon key. Please enable the anon key in your project&apos;s
          API settings to use this block.
        </div>
      )}
    </div>
  )
}
