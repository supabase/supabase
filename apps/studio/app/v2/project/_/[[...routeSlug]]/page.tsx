'use client'

import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'common'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, Building2, ChevronRight, Search } from 'lucide-react'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { Alert_Shadcn_ as Alert, AlertDescription_Shadcn_ as AlertDescription, AlertTitle_Shadcn_ as AlertTitle } from 'ui'

/**
 * Disambiguation page for /v2/project/_/[...routeSlug].
 *
 * The literal `_` segment can never collide with a real project ref, so any
 * link that doesn't yet know the target project (e.g. deep-links from docs or
 * CLI output) can point here. The user picks a project and is forwarded to
 * /v2/project/[projectRef]/[...routeSlug] with the same sub-path preserved.
 */
export default function V2ProjectDisambiguationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const routeSlug = params?.routeSlug as string[] | undefined

  const subPath = routeSlug?.length ? `/${routeSlug.join('/')}` : '/data/tables'

  const [lastVisitedOrgSlug] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION, '')
  const {
    data: organizations = [],
    isPending: isLoadingOrgs,
    isError: isErrorOrgs,
  } = useOrganizationsQuery({ enabled: IS_PLATFORM })
  const [selectedOrgSlug, setSelectedOrgSlug] = useState<string | undefined>(undefined)
  const activeOrg = organizations.find((o) => o.slug === selectedOrgSlug) ?? organizations[0]

  useEffect(() => {
    if (selectedOrgSlug) return
    if (lastVisitedOrgSlug) {
      setSelectedOrgSlug(lastVisitedOrgSlug)
      return
    }
    if (organizations.length > 0) {
      setSelectedOrgSlug(organizations[0].slug)
    }
  }, [selectedOrgSlug, lastVisitedOrgSlug, organizations])

  const [search, setSearch] = useState('')

  const { data: projectsData, isPending: isLoadingProjects } = useOrgProjectsInfiniteQuery(
    { slug: activeOrg?.slug, limit: 50 },
    { enabled: Boolean(activeOrg?.slug) }
  )
  const allProjects = projectsData?.pages?.flatMap((p) => p.projects) ?? []
  const projects = search.trim()
    ? allProjects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : allProjects

  const queryString = useMemo(() => {
    const qs = searchParams?.toString() ?? ''
    return qs.length > 0 ? `?${qs}` : ''
  }, [searchParams])

  const handleSelectProject = (ref: string) => {
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    router.push(`/v2/project/${ref}${subPath}${queryString}${hash}`)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">Select a project</h1>
        {subPath !== '/data/tables' && (
          <p className="text-sm text-muted-foreground mt-1">
            You'll be taken to <span className="font-mono text-xs">{subPath}</span> after selecting.
          </p>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Org sidebar */}
        <aside className="w-56 shrink-0 border-r border-border overflow-y-auto py-2">
          {isLoadingOrgs ? (
            <div className="space-y-1 px-3 py-2">
              <ShimmeringLoader className="h-7" />
              <ShimmeringLoader className="h-7 w-4/5" />
            </div>
          ) : isErrorOrgs ? (
            <div className="p-3">
              <Alert variant="warning">
                <AlertTriangle />
                <AlertTitle>Failed to load organizations</AlertTitle>
                <AlertDescription>Try refreshing the page.</AlertDescription>
              </Alert>
            </div>
          ) : (
            organizations.map((org) => {
              const isActive = org.slug === activeOrg?.slug
              return (
                <button
                  key={org.slug}
                  type="button"
                  onClick={() => setSelectedOrgSlug(org.slug)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{org.name}</span>
                </button>
              )
            })
          )}
        </aside>

        {/* Project list */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground/30 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingProjects ? (
              <div className="space-y-1 p-4">
                <ShimmeringLoader className="h-10" />
                <ShimmeringLoader className="h-10 w-4/5" />
                <ShimmeringLoader className="h-10 w-3/5" />
              </div>
            ) : !activeOrg ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                No organizations available.
              </div>
            ) : projects.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                {search ? 'No projects match your search.' : 'No projects in this organization.'}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {projects.map((project) => (
                  <li key={project.ref}>
                    <button
                      type="button"
                      onClick={() => handleSelectProject(project.ref)}
                      className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-sidebar-accent/50 transition-colors group"
                    >
                      <div>
                        <div className="text-sm font-medium text-foreground">{project.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{project.ref}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
