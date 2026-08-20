import { useParams } from 'common'
import { EyeOff, MoreVertical, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import type { Worker } from '../Workers.types'
import { AddSecretDialog } from './AddSecretDialog'
import { AlertError } from '@/components/ui/AlertError'
import { useSecretsQuery } from '@/data/secrets/secrets-query'
import {
  removeWorkerOverride,
  setProjectSecretAccess,
  setWorkerOverride,
  useWorkerOverrides,
} from '@/state/worker-secret-overrides'

interface WorkerSecretsSectionProps {
  worker: Worker
}

type SecretSource = 'project' | 'overridden' | 'worker-only' | 'denied'

interface ResolvedSecret {
  name: string
  source: SecretSource
  updatedAt?: string
}

const MASKED = '••••••••'

const SOURCE_BADGE: Record<SecretSource, { label: string; variant?: 'success' | 'warning' }> = {
  project: { label: 'From project' },
  overridden: { label: 'Override', variant: 'warning' },
  'worker-only': { label: 'This worker', variant: 'success' },
  denied: { label: 'Denied', variant: 'warning' },
}

const isCustomSecret = (name: string) => !name.startsWith('SUPABASE_')

export const WorkerSecretsSection = ({ worker }: WorkerSecretsSectionProps) => {
  const { ref: projectRef } = useParams()

  const {
    data: projectSecrets = [],
    error,
    isLoading,
    isError,
    isSuccess,
  } = useSecretsQuery({ projectRef })

  if (!projectRef) return null

  const { overrides, denied } = useWorkerOverrides(projectRef, worker.name)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [pendingOverride, setPendingOverride] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<{
    name: string
    source: Extract<SecretSource, 'overridden' | 'worker-only'>
  } | null>(null)

  const resolved = useMemo<ResolvedSecret[]>(() => {
    const customProjectSecrets = projectSecrets.filter((s) => isCustomSecret(s.name))
    const projectNames = new Set(customProjectSecrets.map((s) => s.name))
    const deniedSet = new Set(denied)

    const projectRows: ResolvedSecret[] = customProjectSecrets.map((secret) => {
      if (deniedSet.has(secret.name)) {
        return { name: secret.name, source: 'denied', updatedAt: secret.updated_at ?? undefined }
      }
      if (overrides[secret.name]) {
        return {
          name: secret.name,
          source: 'overridden',
          updatedAt: overrides[secret.name].updatedAt,
        }
      }
      return { name: secret.name, source: 'project', updatedAt: secret.updated_at ?? undefined }
    })

    const workerOnlyRows: ResolvedSecret[] = Object.values(overrides)
      .filter((override) => !projectNames.has(override.name))
      .map((override) => ({
        name: override.name,
        source: 'worker-only',
        updatedAt: override.updatedAt,
      }))

    return [...projectRows, ...workerOnlyRows].sort((a, b) => a.name.localeCompare(b.name))
  }, [projectSecrets, overrides, denied])

  const overrideCount = Object.keys(overrides).length
  const denyCount = denied.length
  const summaryParts: string[] = []
  if (overrideCount > 0) summaryParts.push(`${overrideCount} override${overrideCount === 1 ? '' : 's'}`)
  if (denyCount > 0) summaryParts.push(`${denyCount} denied`)

  const handleAddOrOverride = ({ name, value }: { name: string; value: string }) => {
    setWorkerOverride(projectRef, worker.name, { name, value })
    if (projectSecrets.some((s) => s.name === name)) {
      toast.success(`Overriding "${name}" on ${worker.name}`)
    } else {
      toast.success(`Added worker-only secret ${name}`)
    }
    setIsAddOpen(false)
    setPendingOverride(null)
  }

  const handleConfirmRemove = () => {
    if (!pendingRemove) return
    removeWorkerOverride(projectRef, worker.name, pendingRemove.name)
    toast.success(
      pendingRemove.source === 'worker-only'
        ? `Removed worker-only secret ${pendingRemove.name}`
        : `Removed override for ${pendingRemove.name}`
    )
    setPendingRemove(null)
  }

  const existingOverrideNames = Object.keys(overrides)

  return (
    <>
      <div className="space-y-3">
        <Admonition
          type="default"
          title="Preview of fine-grained per-worker secrets"
          description="Overrides and denies are stored locally in this prototype. The future Workers Secrets API will replace this with real, versioned per-worker scoping."
        />

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-foreground-light">
            Inherits project secrets by default.
            {summaryParts.length > 0 && (
              <span className="text-foreground-lighter"> · {summaryParts.join(' · ')}</span>
            )}
          </p>
          <Button variant="default" size="tiny" icon={<Plus />} onClick={() => setIsAddOpen(true)}>
            Add override
          </Button>
        </div>

        {isLoading && <GenericSkeletonLoader />}
        {isError && <AlertError error={error} subject="Failed to load project secrets" />}
        {isSuccess && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolved.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-foreground-lighter">
                      No secrets in scope for this worker. Add one to the project pool or set a
                      worker-only secret above.
                    </TableCell>
                  </TableRow>
                )}
                {resolved.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell>
                      <code className="text-code-inline">{row.name}</code>
                    </TableCell>
                    <TableCell>
                      {row.source === 'denied' ? (
                        <span className="text-sm text-foreground-lighter">Not accessible</span>
                      ) : (
                        <code className="text-code-inline text-foreground-light!">{MASKED}</code>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={SOURCE_BADGE[row.source].variant}>
                        {SOURCE_BADGE[row.source].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-label="Secret options"
                              variant="text"
                              size="tiny"
                              icon={<MoreVertical size={14} />}
                              className="px-1.5 text-foreground-lighter hover:text-foreground"
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {row.source === 'project' && (
                              <>
                                <DropdownMenuItem
                                  className="flex items-center gap-2"
                                  onClick={() => setPendingOverride(row.name)}
                                >
                                  <Pencil size={12} /> Override value
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setProjectSecretAccess(projectRef, worker.name, row.name, false)
                                    toast.success(`${worker.name} can no longer read ${row.name}`)
                                  }}
                                >
                                  <EyeOff size={12} /> Deny access
                                </DropdownMenuItem>
                              </>
                            )}
                            {row.source === 'overridden' && (
                              <>
                                <DropdownMenuItem
                                  className="flex items-center gap-2"
                                  onClick={() => setPendingOverride(row.name)}
                                >
                                  <Pencil size={12} /> Edit override
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="flex items-center gap-2"
                                  onClick={() =>
                                    setPendingRemove({ name: row.name, source: 'overridden' })
                                  }
                                >
                                  <RotateCcw size={12} /> Revert to project
                                </DropdownMenuItem>
                              </>
                            )}
                            {row.source === 'worker-only' && (
                              <DropdownMenuItem
                                className="flex items-center gap-2 text-destructive focus:text-destructive"
                                onClick={() =>
                                  setPendingRemove({ name: row.name, source: 'worker-only' })
                                }
                              >
                                <Trash2 size={12} /> Delete secret
                              </DropdownMenuItem>
                            )}
                            {row.source === 'denied' && (
                              <>
                                <DropdownMenuItem
                                  className="flex items-center gap-2"
                                  onClick={() => {
                                    setProjectSecretAccess(projectRef, worker.name, row.name, true)
                                    toast.success(`${worker.name} can now read ${row.name}`)
                                  }}
                                >
                                  <RotateCcw size={12} /> Restore access
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="flex items-center gap-2"
                                  onClick={() => setPendingOverride(row.name)}
                                >
                                  <Pencil size={12} /> Override with value
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Add worker-only or override */}
      <AddSecretDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={handleAddOrOverride}
        existingNames={existingOverrideNames}
        title={`Add secret to ${worker.name}`}
        description="Overrides a project secret with the same name, or adds a worker-only secret."
        submitLabel="Add secret"
        hint="If the name matches a project secret, it becomes an override for just this worker."
      />

      {/* Override a specific inherited secret */}
      <AddSecretDialog
        open={pendingOverride !== null}
        onOpenChange={(next) => (!next ? setPendingOverride(null) : undefined)}
        onSubmit={handleAddOrOverride}
        existingNames={[]}
        lockedName={pendingOverride ?? undefined}
        title={`Override "${pendingOverride ?? ''}"`}
        description="Set a value that only this worker sees. Other workers keep the project value."
        submitLabel="Save override"
      />

      <ConfirmationModal
        visible={pendingRemove !== null}
        variant="destructive"
        title={
          pendingRemove?.source === 'worker-only'
            ? `Delete secret "${pendingRemove?.name}"`
            : `Remove override for "${pendingRemove?.name ?? ''}"`
        }
        confirmLabel={pendingRemove?.source === 'worker-only' ? 'Delete secret' : 'Remove override'}
        onCancel={() => setPendingRemove(null)}
        onConfirm={handleConfirmRemove}
        alert={{
          title:
            pendingRemove?.source === 'worker-only'
              ? 'This secret only exists on this worker'
              : 'This worker will fall back to the project value',
        }}
      />
    </>
  )
}
