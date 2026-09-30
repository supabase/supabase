import { useParams } from 'common'
import { useFormContext } from 'react-hook-form'
import { FormLabel, SheetSection } from 'ui'
import { KeyValueFieldArray } from 'ui-patterns/form/KeyValueFieldArray/KeyValueFieldArray'

import { CreateCronJobForm } from './CreateCronJobSheet/CreateCronJobSheet.constants'
import { buildEdgeFunctionHeaderAddActions } from '@/components/interfaces/Functions/httpHeaderAddActions'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'

interface HTTPHeaderFieldsSectionProps {
  variant: 'edge_function' | 'http_request'
}

export const HTTPHeaderFieldsSection = ({ variant }: HTTPHeaderFieldsSectionProps) => {
  const form = useFormContext<CreateCronJobForm>()

  const { ref } = useParams()
  const { can: canReadAPIKeys } = useAsyncCheckPermissionsV2([
    FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_READ,
    FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_SECRET_READ
  ])
  const { data: apiKeysData } = useAPIKeys(
    { projectRef: ref, reveal: true },
    { enabled: canReadAPIKeys }
  )
  const { serviceKey, secretKey } = apiKeysData ?? {}

  const apiKey = secretKey?.api_key ?? serviceKey?.api_key ?? '[YOUR API KEY]'
  const addActions =
    variant === 'edge_function'
      ? buildEdgeFunctionHeaderAddActions({
          apiKey,
          createRow: (name: string, value: string) => ({ name, value }),
        })
      : []

  return (
    <SheetSection>
      <FormLabel>HTTP Headers</FormLabel>
      <KeyValueFieldArray
        control={form.control}
        name="values.httpHeaders"
        keyFieldName="name"
        valueFieldName="value"
        createEmptyRow={() => ({ name: '', value: '' })}
        keyPlaceholder="Header name"
        valuePlaceholder="Header value"
        addLabel="Add header"
        addActions={addActions}
      />
    </SheetSection>
  )
}
