import { useState } from 'react'
import { useRouter } from 'next/router'
import { AlertCircle, Database, Loader2, Plus, Trash2, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from 'ui'

import { CreateProjectModal } from '@/components/interfaces/CreateProjectModal'
import { CredentialsModal } from '@/components/interfaces/CredentialsModal'
import { useDeleteProject, type CreatedProject } from '@/data/projects/create-project-mutation'
import { useSelfHostedProjects } from '@/hooks/useMultiDatabaseProjects'
import { useProjectStatus, type ProjectStatus } from '@/data/projects/project-status-query'

function StatusBadge({ status }: { status: ProjectStatus | undefined }) {
  if (!status || status === 'UNKNOWN') {
    return (
      <span className="flex items-center gap-1 text-xs text-foreground-muted">
        <Loader2 size={12} className="animate-spin" />
        Checking…
      </span>
    )
  }

  const config: Record<string, { dot: string; label: string; text: string }> = {
    ACTIVE_HEALTHY: { dot: 'bg-brand', label: 'Active', text: 'text-brand' },
    COMING_UP: { dot: 'bg-yellow-500', label: 'Starting', text: 'text-yellow-600' },
    INACTIVE: { dot: 'bg-foreground-muted', label: 'Inactive', text: 'text-foreground-muted' },
  }

  const c = config[status] ?? { dot: 'bg-foreground-muted', label: status, text: 'text-foreground-muted' }

  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

interface SelfHostedProject {
  ref: string
  name: string
  db_host?: string
  db_port?: number
}

function ProjectCard({
  project,
  onDelete,
}: {
  project: SelfHostedProject
  onDelete: (ref: string, name: string) => void
}) {
  const router = useRouter()
  const isDefault = project.ref === 'default'
  const { data: statusData } = useProjectStatus(project.ref, { refetchInterval: 10000 })

  return (
    <div className="group relative flex flex-col rounded-lg border border-muted bg-surface-100 hover:bg-surface-200 transition-colors overflow-hidden">
      <button
        className="flex-1 flex flex-col gap-3 p-5 text-left"
        onClick={() => router.push(`/project/${project.ref}/editor`)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center flex-shrink-0">
              <Database size={16} className="text-brand" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">{project.name}</p>
              <p className="text-xs text-foreground-muted font-mono mt-0.5">{project.ref}</p>
            </div>
          </div>
          <StatusBadge status={statusData?.status} />
        </div>

        {project.db_host && (
          <p className="text-xs text-foreground-muted font-mono">
            {project.db_host}:{project.db_port ?? 5432}
          </p>
        )}

        <div className="flex items-center gap-1 text-xs text-foreground-muted">
          <Activity size={11} />
          <span>Open Studio</span>
        </div>
      </button>

      {!isDefault && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="text"
            size="tiny"
            icon={<Trash2 size={14} />}
            className="text-foreground-muted hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(project.ref, project.name)
            }}
          />
        </div>
      )}
    </div>
  )
}

export default function SelfHostedProjectsPage() {
  const router = useRouter()
  const { data: projects = [], isLoading, isError, refetch } = useSelfHostedProjects()
  const [createOpen, setCreateOpen] = useState(false)
  const [credentialsProject, setCredentialsProject] = useState<CreatedProject | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ ref: string; name: string } | null>(null)

  const { mutate: deleteProject, isLoading: isDeleting } = useDeleteProject({
    onSuccess: () => {
      toast.success('Database deleted')
      setDeleteTarget(null)
      refetch()
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to delete database')
    },
  })

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    const confirmed = window.confirm(
      `Delete "${deleteTarget.name}"?\n\nThis will permanently delete all data. This cannot be undone.`
    )
    if (confirmed) deleteProject(deleteTarget.ref)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Databases</h1>
            <p className="text-sm text-foreground-muted mt-1">
              Each database is a full isolated Supabase project with its own Auth, Storage, and
              Realtime.
            </p>
          </div>
          <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            New database
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-foreground-muted" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-foreground-muted">
            <AlertCircle size={32} />
            <p className="text-sm">Failed to load databases</p>
            <Button type="outline" size="tiny" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !isError && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-foreground-muted">
            <Database size={40} strokeWidth={1.5} />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">No databases yet</p>
              <p className="text-xs mt-1">Create your first database to get started</p>
            </div>
            <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
              New database
            </Button>
          </div>
        )}

        {!isLoading && !isError && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.ref}
                project={project}
                onDelete={(ref, name) => {
                  setDeleteTarget({ ref, name })
                  // Defer to next tick so state is set before confirm
                  setTimeout(handleDeleteConfirm, 0)
                }}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(project) => {
          setCreateOpen(false)
          setCredentialsProject(project)
          refetch()
        }}
      />

      <CredentialsModal
        open={credentialsProject !== null}
        onOpenChange={(open) => {
          if (!open) setCredentialsProject(null)
        }}
        project={credentialsProject}
      />
    </div>
  )
}