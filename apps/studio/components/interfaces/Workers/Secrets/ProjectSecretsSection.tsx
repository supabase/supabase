import dayjs from 'dayjs'
import { KeyRound, MoreVertical, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

// Reuse the exact Edge Functions add-secret form so the two products stay in
// lockstep — same validation, paste-parsing, and bulk-add behaviour.
import { AddNewSecretForm } from '@/components/interfaces/Functions/EdgeFunctionSecrets/AddNewSecretForm'
// Reuse the Edge Functions defaults — SUPABASE_URL / SUPABASE_DB_URL / etc. are
// project-level env vars, so Workers get the exact same set. Extract to a
// shared module once a third consumer needs them.
import { DefaultEdgeFunctionSecrets } from '@/components/interfaces/Functions/EdgeFunctionSecrets/DefaultEdgeFunctionSecrets'
import {
  getVisibleDefaultEdgeFunctionSecrets,
  isInternalEdgeFunctionSecret,
} from '@/components/interfaces/Functions/EdgeFunctionSecrets/DefaultEdgeFunctionSecrets.utils'
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { useSecretsDeleteMutation } from '@/data/secrets/secrets-delete-mutation'
import { useSecretsQuery } from '@/data/secrets/secrets-query'
import { DOCS_URL } from '@/lib/constants'

interface ProjectSecretsSectionProps {
  projectRef: string
}

const MASKED = '••••••••'

export const ProjectSecretsSection = ({ projectRef }: ProjectSecretsSectionProps) => {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const {
    data = [],
    error,
    isLoading,
    isError,
    isSuccess,
  } = useSecretsQuery({ projectRef })

  // Custom = user-managed secrets (SUPABASE_* / defaults live in their own
  // section below).
  const customSecrets = useMemo(
    () => data.filter((secret) => !isInternalEdgeFunctionSecret(secret.name)),
    [data]
  )

  // Match Edge Functions' logic: prefer the SUPABASE_* defaults actually
  // returned by the API, fall back to the full hardcoded list for empty
  // projects. Runtime defaults (SB_REGION etc.) are appended.
  const visibleDefaultSecrets = useMemo(
    () => getVisibleDefaultEdgeFunctionSecrets(new Set(data.map((secret) => secret.name))),
    [data]
  )

  const { mutate: deleteSecrets, isPending: isDeleting } = useSecretsDeleteMutation({
    onSuccess: (_, variables) => {
      toast.success(`Deleted secret ${variables.secrets[0] ?? ''}`)
      setPendingDelete(null)
    },
  })

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    deleteSecrets({ projectRef, secrets: [pendingDelete] })
  }

  return (
    <>
      <div className="space-y-10">
        <AddNewSecretForm />

        <section className="space-y-4">
          <p className="text-sm text-foreground-light">
            {isLoading
              ? 'Loading secrets…'
              : `${customSecrets.length} secret${customSecrets.length === 1 ? '' : 's'} in this project — shared with every worker by default.`}
          </p>

          {isLoading && <GenericSkeletonLoader />}
          {isError && <AlertError error={error} subject="Failed to load secrets" />}
          {isSuccess && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="hidden md:table-cell">Updated</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customSecrets.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-10 text-center text-sm text-foreground-lighter"
                      >
                        <KeyRound size={16} className="mx-auto mb-2 text-foreground-lighter" />
                        No secrets yet. Add one to expose it to your workers.
                      </TableCell>
                    </TableRow>
                  )}
                  {customSecrets.map((secret) => (
                    <TableRow key={secret.name}>
                      <TableCell>
                        <code className="text-code-inline">{secret.name}</code>
                      </TableCell>
                      <TableCell>
                        <code className="text-code-inline text-foreground-light!">{MASKED}</code>
                      </TableCell>
                      <TableCell className="hidden text-foreground-light md:table-cell">
                        {secret.updated_at
                          ? dayjs(secret.updated_at).format('MMM D, YYYY HH:mm')
                          : '—'}
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
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                className="flex items-center gap-2 text-destructive focus:text-destructive"
                                onClick={() => setPendingDelete(secret.name)}
                              >
                                <Trash2 size={12} /> Delete
                              </DropdownMenuItem>
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
        </section>

        {isSuccess && (
          <section className="space-y-3">
            <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
              <div className="space-y-1">
                <h3 className="text-base text-foreground">Default secrets</h3>
                <p className="text-sm text-foreground-light">
                  Reserved secrets available in every worker
                </p>
              </div>
              <DocsButton href={`${DOCS_URL}/guides/functions/secrets#default-secrets`} />
            </div>
            <DefaultEdgeFunctionSecrets secrets={visibleDefaultSecrets} />
          </section>
        )}
      </div>

      <ConfirmationModal
        visible={pendingDelete !== null}
        variant="destructive"
        title={`Delete secret "${pendingDelete ?? ''}"`}
        confirmLabel="Delete secret"
        confirmLabelLoading="Deleting"
        loading={isDeleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        alert={{
          title: 'Every worker will lose access to this secret',
          description:
            'Any per-worker overrides for this name will fall back to no value. Workers pick up the change on their next deploy.',
        }}
      />
    </>
  )
}
