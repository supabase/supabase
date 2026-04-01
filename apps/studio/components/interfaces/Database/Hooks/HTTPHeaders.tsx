import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { UseFormReturn } from 'react-hook-form'
import { useWatch_Shadcn_ } from 'ui'
import { KeyValueFieldArray } from 'ui-patterns/form/KeyValueFieldArray/KeyValueFieldArray'

import { WebhookFormValues } from './EditHookPanel.constants'
import { buildEdgeFunctionHeaderAddActions } from '@/components/interfaces/Functions/httpHeaderAddActions'
import {
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from '@/components/ui/Forms/FormSection'
import { getKeys, useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { uuidv4 } from '@/lib/helpers'

interface HTTPHeadersProps {
  form: UseFormReturn<WebhookFormValues>
}

export const HTTPHeaders = ({ form }: HTTPHeadersProps) => {
  const { ref } = useParams()
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')

  const { data: apiKeys } = useAPIKeysQuery(
    { projectRef: ref, reveal: true },
    { enabled: canReadAPIKeys }
  )

  const { serviceKey, secretKey } = getKeys(apiKeys)
  const apiKey = secretKey?.api_key ?? serviceKey?.api_key ?? '[YOUR API KEY]'

  const functionType = useWatch_Shadcn_({ control: form.control, name: 'function_type' })
  const addActions =
    functionType === 'supabase_function'
      ? buildEdgeFunctionHeaderAddActions({
          apiKey,
          includeApiKeyHeader: serviceKey?.type === 'secret',
          createRow: (name: string, value: string) => ({ id: uuidv4(), name, value }),
        })
      : []

  return (
    <FormSection
      header={<FormSectionLabel className="lg:!col-span-4">HTTP Headers</FormSectionLabel>}
    >
      <FormSectionContent loading={false} className="lg:!col-span-8">
        <KeyValueFieldArray
          control={form.control}
          name="httpHeaders"
          keyFieldName="name"
          valueFieldName="value"
          createEmptyRow={() => ({ id: uuidv4(), name: '', value: '' })}
          keyPlaceholder="Header name"
          valuePlaceholder="Header value"
          addLabel="Add a new header"
          addActions={addActions}
        />
      </FormSectionContent>
    </FormSection>
  )
}
