import dayjs from 'dayjs'
import { KeyRound, MoreVertical, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
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

import { AddSecretDialog } from './AddSecretDialog'
import { AlertError } from '@/components/ui/AlertError'
import { useSecretsCreateMutation } from '@/data/secrets/secrets-create-mutation'
import { useSecretsDeleteMutation } from '@/data/secrets/secrets-delete-mutation'
import { useSecretsQuery } from '@/data/secrets/secrets-query'

interface ProjectSecretsSectionProps {
  projectRef: string
}

const MASKED = '••••••••'

// Filter out the platform-injected secrets (SUPABASE_URL, etc.) — Edge Functions
// keeps those on a separate "default secrets" list.
const isCustomSecret = (name: string) => !name.startsWith('SUPABASE_')

export const ProjectSecretsSection = ({ projectRef }: ProjectSecretsSectionProps) => {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const {
    data = [],
    error,
    isLoading,
    isError,
    isSuccess,
  } = useSecretsQuery({ projectRef })

  const customSecrets = data.filter((secret) => isCustomSecret(secret.name))

  const { mutate: createSecrets, isPending: isCreating } = useSecretsCreateMutation({
    onSuccess: (_, variables) => {
      toast.success(`Added secret ${variables.secrets[0]?.name ?? ''}`)
      setIsAddOpen(false)
    },
  })

  const { mutate: deleteSecrets, isPending: isDeleting } = useSecretsDeleteMutation({
    onSuccess: (_, variables) => {
      toast.success(`Deleted secret ${variables.secrets[0] ?? ''}`)
      setPendingDelete(null)
    },
  })

  const handleAdd = ({ name, value }: { name: string; value: string }) => {
    createSecrets({ projectRef, secrets: [{ name, value }] })
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    deleteSecrets({ projectRef, secrets: [pendingDelete] })
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-foreground-light">
            {isLoading
              ? 'Loading secrets…'
              : `${customSecrets.length} secret${customSecrets.length === 1 ? '' : 's'} in this project — shared with every worker by default. Restrict access per worker from that worker's Settings tab.`}
          </p>
          <Button
            variant="primary"
            size="tiny"
            icon={<Plus />}
            onClick={() => setIsAddOpen(true)}
          >
            Add secret
          </Button>
        </div>

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
      </div>

      <AddSecretDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={handleAdd}
        existingNames={data.map((s) => s.name)}
        title="Add project secret"
        description="Secrets are shared with every worker by default. You can restrict access per worker later."
        submitLabel="Add secret"
        isLoading={isCreating}
      />

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
