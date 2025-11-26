import type { PostgresTable } from '@supabase/postgres-meta'
import { useMemo } from 'react'

import { ToggleRlsButton } from 'components/ui/ToggleRlsButton'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { toast } from 'sonner'
import type { ResponseError } from 'types'
import {
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  HoverCard_Shadcn_,
  HoverCardContent_Shadcn_,
  HoverCardTrigger_Shadcn_,
  Label_Shadcn_,
  SimpleCodeBlock,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { generatePolicyUpdateSQL } from 'components/interfaces/Auth/Policies/PolicyTableRow/PolicyTableRow.utils'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface RLSManagementProps {
  schema: string
  table?: PostgresTable
  isRlsEnabled: boolean
  onChangeRlsEnabled?: (isEnabled: boolean) => void
  isNewRecord: boolean
  isDuplicating: boolean
  generateStartingPolicies?: boolean
  onChangeGenerateStartingPolicies?: (enabled: boolean) => void
}

type PolicyListItem = {
  id: string
  name: string
  source: 'existing' | 'generated'
  action?: string | null
  command?: string | null
  definition?: string | null
}

export const RLSManagement = ({
  schema,
  table,
  isRlsEnabled,
  onChangeRlsEnabled,
  isNewRecord,
  isDuplicating,
  generateStartingPolicies = false,
  onChangeGenerateStartingPolicies,
}: RLSManagementProps) => {
  const { data: project } = useSelectedProjectQuery()

  const isExistingTable = !!table && !isNewRecord && !isDuplicating
  const rlsEnabled = isRlsEnabled ?? true

  const { data: policies } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const tablePolicies = (policies ?? []).filter(
    (policy) => policy.schema === table?.schema && policy.table === table?.name
  )

  const existingPoliciesList = useMemo<PolicyListItem[]>(
    () =>
      (tablePolicies ?? []).map((policy) => ({
        id: String(policy.id),
        name: policy.name,
        action: policy.action,
        command: policy.command,
        definition: generatePolicyUpdateSQL(policy),
        source: 'existing' as const,
      })),
    [tablePolicies]
  )
  const hasPolicies = existingPoliciesList.length > 0

  const handleRlsToggleSuccess = (nextIsEnabled: boolean) => {
    onChangeRlsEnabled?.(nextIsEnabled)
    toast.success(
      nextIsEnabled
        ? 'Row Level Security has been enabled for this table.'
        : 'Row Level Security has been disabled for this table.'
    )
  }

  const handleRlsToggleError = (error: ResponseError) => {
    toast.error(error.message ?? 'Unable to update Row Level Security for this table.')
  }

  const renderEnableRlsButton = () => {
    if (!project || !table || !isExistingTable) return null
    return (
      <ToggleRlsButton
        type="default"
        size="tiny"
        schema={table.schema ?? schema}
        tableName={table.name}
        isRlsEnabled={rlsEnabled}
        projectRef={project.ref}
        connectionString={project.connectionString ?? null}
        onSuccess={handleRlsToggleSuccess}
        onError={handleRlsToggleError}
        className="w-fit mt-4"
      />
    )
  }

  const disablePoliciesList = isExistingTable && !rlsEnabled

  const renderPolicies = () => {
    if (!hasPolicies) {
      return (
        <CardContent>
          <p className="text-sm text-foreground-lighter">No policies exist for this table</p>
        </CardContent>
      )
    }

    return (
      <CardContent className="p-0">
        {existingPoliciesList.map((policy) => (
          <HoverCard_Shadcn_ key={policy.id} openDelay={200} closeDelay={100}>
            <HoverCardTrigger_Shadcn_ asChild>
              <CardContent className="flex items-center justify-between text-sm text-foreground hover:bg-surface-100 cursor-pointer transition-colors">
                <div className="space-y-1">
                  <p className="font-mono text-xs">{policy.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {(policy.action || policy.command) && (
                    <Badge variant="default">{policy.action ?? policy.command}</Badge>
                  )}
                </div>
              </CardContent>
            </HoverCardTrigger_Shadcn_>
            <HoverCardContent_Shadcn_ className="w-96">
              {policy.definition ? (
                <SimpleCodeBlock className="language-sql" showCopy={false}>
                  {policy.definition}
                </SimpleCodeBlock>
              ) : (
                <p className="text-xs text-foreground-lighter">No definition available.</p>
              )}
            </HoverCardContent_Shadcn_>
          </HoverCard_Shadcn_>
        ))}
      </CardContent>
    )
  }

  if (!project) return null

  // For new tables, show the switch to generate starting policies
  if (isNewRecord && !isDuplicating) {
    return (
      <div>
        <h3 className="mb-4">Policies</h3>
        <div className="flex flex-col-reverse gap-2 md:gap-6 md:flex-row-reverse md:justify-between">
          <div className="flex flex-col justify-center items-start md:items-end shrink-0">
            <Switch
              id="generate-starting-policies"
              checked={generateStartingPolicies}
              onCheckedChange={onChangeGenerateStartingPolicies}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <Label_Shadcn_
              htmlFor="generate-starting-policies"
              className="text-foreground cursor-pointer"
            >
              Generate starting policies
            </Label_Shadcn_>
            <p className="text-sm text-foreground-light mt-1">
              Policies are auto-generated from your schema and can be customized after table
              creation.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // For existing tables, show the policies list
  return (
    <div>
      <div className="flex items-center mb-4 gap-2">
        <div className="flex-1">
          <h3>Policies</h3>
          <p className="text-sm text-foreground-lighter">
            Set rules around who can read and write data to this table
          </p>
        </div>
        <Button
          asChild
          type="default"
          size="tiny"
          icon={<ExternalLink size={16} strokeWidth={1.5} />}
        >
          <Link href={`/project/${project.ref}/auth/policies`} target="_blank">
            Manage policies
          </Link>
        </Button>
      </div>

      {isExistingTable && !rlsEnabled && (
        <Admonition
          className="mb-4"
          type="warning"
          title="Row Level Security is disabled"
          description="Your table is currently accessible by anyone on the internet. We recommend enabling RLS to restrict access."
          actions={renderEnableRlsButton()}
        />
      )}

      <Card
        aria-disabled={disablePoliciesList}
        className={cn(disablePoliciesList && 'opacity-50 pointer-events-none')}
      >
        {renderPolicies()}
      </Card>
    </div>
  )
}
