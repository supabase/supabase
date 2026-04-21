import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useFormContext } from 'react-hook-form'
import { FormLabel_Shadcn_, SheetSection } from 'ui'
import { KeyValueFieldArray } from 'ui-patterns/form/KeyValueFieldArray/KeyValueFieldArray'

import { CreateCronJobForm } from './CreateCronJobSheet/CreateCronJobSheet.constants'
import { buildEdgeFunctionHeaderAddActions } from '@/components/interfaces/Functions/httpHeaderAddActions'
import { getKeys, useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

interface HTTPHeaderFieldsSectionProps {
  variant: 'edge_function' | 'http_request'
}

export const HTTPHeaderFieldsSection = ({ variant }: HTTPHeaderFieldsSectionProps) => {
  const form = useFormContext<CreateCronJobForm>()

  const { ref } = useParams()
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')
  const { data: apiKeys } = useAPIKeysQuery(
    { projectRef: ref, reveal: true },
    { enabled: canReadAPIKeys }
  )

  const { serviceKey, secretKey } = getKeys(apiKeys)
  const apiKey = secretKey?.api_key ?? serviceKey?.api_key ?? '[YOUR API KEY]'
  const addActions =
    variant === 'edge_function'
      ? buildEdgeFunctionHeaderAddActions({
          apiKey,
          includeApiKeyHeader: serviceKey?.type === 'secret',
          createRow: (name: string, value: string) => ({ name, value }),
        })
      : []

  return (
    <SheetSection>
      <FormLabel_Shadcn_>HTTP Headers</FormLabel_Shadcn_>
      <KeyValueFieldArray
        control={form.control}
        name="values.httpHeaders"
        keyFieldName="name"
        valueFieldName="value"
        createEmptyRow={() => ({ name: '', value: '' })}
        keyPlaceholder="Header name"
        valuePlaceholder="Header value"
        addLabel="Add a new header"
        addActions={addActions}
      />
    </SheetSection>
  )
}
