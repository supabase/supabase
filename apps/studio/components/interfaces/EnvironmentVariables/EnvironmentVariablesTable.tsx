import { PermissionAction } from '@supabase/shared-types/out/constants'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { KeyRound } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import type { EnvironmentVariable } from './EnvironmentVariables.types'
import { DeleteEnvironmentVariableModal } from './DeleteEnvironmentVariableModal'
import { EditEnvironmentVariableSheet } from './EditEnvironmentVariableSheet'
import EnvironmentVariableRow from './EnvironmentVariableRow'
import {
  EnvironmentVariablesFilters,
  type ScopeFilter,
  type SortOption,
} from './EnvironmentVariablesFilters'
import { useEnvironmentVariables } from './useEnvironmentVariables'

const ENV_SERVER = 'http://localhost:3457'

function matchesScope(variable: EnvironmentVariable, scopeFilter: ScopeFilter): boolean {
  if (scopeFilter === 'all') return true
  if (scopeFilter === 'production')
    return variable.scope === 'production' || variable.category === 'platform'
  if (scopeFilter === 'preview')
    return variable.scope === 'preview' || variable.scope === 'branch'
  if (scopeFilter === 'development') return variable.scope === 'development'
  return true
}

function sortVariables(variables: EnvironmentVariable[], sort: SortOption): EnvironmentVariable[] {
  if (sort === 'name') return [...variables].sort((a, b) => a.name.localeCompare(b.name))
  return [...variables].sort((a, b) => {
    if (!a.updatedAt && !b.updatedAt) return 0
    if (!a.updatedAt) return 1
    if (!b.updatedAt) return -1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

export const EnvironmentVariablesTable = () => {
  const { data: project } = useSelectedProjectQuery()
  const projectRef = project?.parentRef

  const [search, setSearch] = useState('')
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all')
  const [sort, setSort] = useState<SortOption>('updated')
  const [isDeleting, setIsDeleting] = useState(false)

  const { can: canReadSecrets, isLoading: isLoadingSecretsPermissions } = useAsyncCheckPermissions(
    PermissionAction.FUNCTIONS_SECRET_READ,
    '*'
  )

  const queryClient = useQueryClient()
  const { variables, isPending, isError, errors } = useEnvironmentVariables()

  const [selectedKeyToEdit, setSelectedKeyToEdit] = useQueryState(
    'edit',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )
  const selectedVariableToEdit = variables.find((v) => v.sourceKey === selectedKeyToEdit)

  const [selectedKeyToDelete, setSelectedKeyToDelete] = useQueryState(
    'delete',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )
  const selectedVariableToDelete = variables.find((v) => v.sourceKey === selectedKeyToDelete)

  const filteredVariables = useMemo(() => {
    let result = variables
    if (search) result = result.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()))
    result = result.filter((v) => matchesScope(v, scopeFilter))
    return sortVariables(result, sort)
  }, [variables, search, scopeFilter, sort])

  async function handleDelete() {
    if (!selectedVariableToDelete || !projectRef) return
    setIsDeleting(true)
    try {
      const scope = selectedVariableToDelete.scope
      const url = `${ENV_SERVER}/projects/${projectRef}/env/${selectedVariableToDelete.name}${scope ? `?scope=${scope}` : ''}`
      await fetch(url, { method: 'DELETE' })
      await queryClient.invalidateQueries({ queryKey: ['env-server', projectRef] })
      toast.success(`Deleted "${selectedVariableToDelete.name}"`)
      setSelectedKeyToDelete(null)
    } catch {
      toast.error('Failed to delete variable')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoadingSecretsPermissions || (canReadSecrets && isPending)) return <GenericSkeletonLoader />
  if (!canReadSecrets) return <NoPermission resourceText="view this project's environment variables" />
  if (isError) return (
    <>
      {errors.map((err, i) => (
        <AlertError key={i} error={err} subject="Failed to retrieve environment variables" />
      ))}
    </>
  )

  return (
    <>
      <div className="space-y-4">
        <EnvironmentVariablesFilters
          search={search}
          onSearchChange={setSearch}
          scopeFilter={scopeFilter}
          onScopeFilterChange={setScopeFilter}
          sort={sort}
          onSortChange={setSort}
        />

        <Card className="overflow-hidden divide-y divide-border">
          {filteredVariables.length > 0 ? (
            filteredVariables.map((variable) => (
              <EnvironmentVariableRow
                key={variable.sourceKey}
                variable={variable}
                onSelectEdit={() => setSelectedKeyToEdit(variable.sourceKey)}
                onSelectDelete={() => setSelectedKeyToDelete(variable.sourceKey)}
              />
            ))
          ) : search || scopeFilter !== 'all' ? (
            <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
              <KeyRound size={24} className="text-foreground-muted" strokeWidth={1.5} />
              <p className="text-sm text-foreground-light">No variables match your filters</p>
              <p className="text-xs text-foreground-lighter">Try adjusting your search or scope filter</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
              <KeyRound size={24} className="text-foreground-muted" strokeWidth={1.5} />
              <p className="text-sm text-foreground">No environment variables yet</p>
              <p className="text-xs text-foreground-lighter">Add a variable above to configure your project's environment</p>
            </div>
          )}
        </Card>
      </div>

      <EditEnvironmentVariableSheet
        secret={selectedVariableToEdit}
        visible={!!selectedVariableToEdit}
        onClose={() => setSelectedKeyToEdit(null)}
      />

      <DeleteEnvironmentVariableModal
        visible={!!selectedVariableToDelete}
        variableName={selectedVariableToDelete?.name}
        loading={isDeleting}
        onCancel={() => setSelectedKeyToDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  )
}
