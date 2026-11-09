import { ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Badge, Button, cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  canRevokePublicFunctionAccess,
  getFunctionExecutePrivileges,
  getFunctionPublicAccessKind,
  type FunctionPublicAccessKind,
} from './function-api-access.utils'
import { useExposedFunctionsQuery } from '@/data/privileges/exposed-functions-query'
import { useRevokePublicFunctionAccessMutation } from '@/data/privileges/revoke-public-function-access-mutation'
import { useIsSchemaExposed } from '@/hooks/misc/useIsSchemaExposed'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

type FunctionApiAccessStatusProps = {
  schema: string
  name: string
  securityDefiner: boolean
  className?: string
}

const accessSummary = (kind: FunctionPublicAccessKind, schemaExposed: boolean): string => {
  if (!schemaExposed) {
    return 'This schema is not exposed to the Data API, so the function is not callable via RPC.'
  }

  switch (kind) {
    case 'anyone':
      return 'Anyone can call this function via the Data API.'
    case 'signed-in':
      return 'Signed-in users can call this function via the Data API.'
    case 'service-role-only':
      return 'Only service_role can call this function via the Data API.'
    case 'none':
      return 'This function is not callable via the Data API.'
  }
}

export const FunctionApiAccessStatus = ({
  schema,
  name,
  securityDefiner,
  className,
}: FunctionApiAccessStatusProps) => {
  const { data: project } = useSelectedProjectQuery()
  const projectRef = project?.ref
  const connectionString = project?.connectionString

  const schemaExposure = useIsSchemaExposed({ projectRef, schemaName: schema })
  const {
    data: grant,
    isPending: isGrantsPending,
    isError: isGrantsError,
  } = useExposedFunctionsQuery(
    { projectRef, connectionString },
    {
      select: (functions) =>
        functions.find((fn) => fn.schema === schema && fn.name === name) ?? null,
    }
  )

  const { mutate: revokePublicAccess, isPending: isRevoking } =
    useRevokePublicFunctionAccessMutation({
      onSuccess: () => {
        toast.success('Public access revoked')
      },
    })

  const isPending = schemaExposure.isPending || isGrantsPending
  const isError = schemaExposure.isError || isGrantsError
  const schemaExposed = schemaExposure.data === true

  if (isPending) {
    return (
      <div className={cn('space-y-2', className)}>
        <ShimmeringLoader className="h-4 w-40" />
        <ShimmeringLoader className="h-4 w-64" />
      </div>
    )
  }

  if (isError) {
    return (
      <Admonition
        type="destructive"
        className={className}
        title="Failed to load Data API access"
        description="Refresh the page and try again."
      />
    )
  }

  const privileges = grant
    ? getFunctionExecutePrivileges(grant)
    : { anon: false, authenticated: false, serviceRole: false }
  const accessKind = getFunctionPublicAccessKind(privileges)
  const showRevoke = schemaExposed && canRevokePublicFunctionAccess(privileges)
  const showDefinerWarning = schemaExposed && privileges.anon && securityDefiner

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h5>Data API access</h5>
          <p className="text-sm text-foreground-light">
            {securityDefiner
              ? 'Runs as the function owner (SECURITY DEFINER).'
              : 'Runs as the calling role (SECURITY INVOKER).'}
          </p>
          <p className="text-sm text-foreground-lighter">
            {accessSummary(accessKind, schemaExposed)}
          </p>
          {schemaExposed && accessKind === 'anyone' && (
            <div className="pt-1">
              <Badge variant="destructive">Unrestricted</Badge>
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {showRevoke && (
            <Button
              variant="default"
              size="tiny"
              loading={isRevoking}
              disabled={isRevoking || !projectRef}
              onClick={() => {
                if (!projectRef) return
                revokePublicAccess({
                  projectRef,
                  connectionString,
                  functionNames: [`${schema}.${name}`],
                })
              }}
            >
              Revoke public access
            </Button>
          )}
          <Button asChild variant="default" size="tiny" icon={<ExternalLinkIcon />}>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={`/project/${projectRef}/integrations/data_api/settings`}
            >
              Manage access
            </Link>
          </Button>
        </div>
      </div>

      {showDefinerWarning && (
        <Admonition
          type="warning"
          title="Public can execute SECURITY DEFINER function"
          description={`Anyone can call this function via /rest/v1/rpc/${name}. It runs with the privileges of its owner. Revoke public access or switch it to SECURITY INVOKER if that is not intentional.`}
        />
      )}
    </div>
  )
}
