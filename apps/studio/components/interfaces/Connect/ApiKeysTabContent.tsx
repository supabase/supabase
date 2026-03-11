import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { AlertCircle, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import type { projectKeys } from './Connect.types'

function KeyRow({ label, value }: { label: ReactNode; value: string }) {
  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-12">
      <div className="col-span-4">
        <h3 className="text-sm text-foreground">{label}</h3>
      </div>
      <div className="col-span-8">
        <Input readOnly copy className="font-mono" value={value} />
      </div>
    </div>
  )
}

export function ApiKeysTabContent({ projectKeys }: { projectKeys: projectKeys }) {
  const { ref: projectRef } = useParams()

  const { isLoading: isLoadingPermissions, can: canReadAPIKeys } = useAsyncCheckPermissions(
    PermissionAction.SECRETS_READ,
    '*'
  )

  if (isLoadingPermissions) {
    return (
      <div className="flex items-center justify-center py-8 space-x-2">
        <Loader2 className="animate-spin" size={16} strokeWidth={1.5} />
        <p className="text-sm text-foreground-light">Retrieving API keys</p>
      </div>
    )
  }

  if (!canReadAPIKeys) {
    return (
      <div className="flex items-center py-8 space-x-2">
        <AlertCircle size={16} strokeWidth={1.5} />
        <p className="text-sm text-foreground-light">You don't have permission to view API keys.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <KeyRow label="Project URL" value={projectKeys.apiUrl ?? ''} />

      <KeyRow label="Publishable Key" value={projectKeys.publishableKey ?? ''} />

      <KeyRow
        label={
          <>
            Anon Key <span className="text-foreground-lighter font-normal">(Legacy)</span>
          </>
        }
        value={projectKeys.anonKey ?? ''}
      />

      <div className="gap-5 lg:grid lg:grid-cols-12">
        <div className="col-start-5 col-span-8 pl-2 flex items-center justify-between">
          <p className="text-xs text-foreground-lighter">For secret keys, see API settings.</p>
          <Button asChild type="default" icon={<ExternalLink size={14} />}>
            <Link href={`/project/${projectRef}/settings/api-keys`}>API settings</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
