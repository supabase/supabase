import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { UseFormReturn } from 'react-hook-form'
import { useWatch } from 'ui'
import { KeyValueFieldArray } from 'ui-patterns/form/KeyValueFieldArray/KeyValueFieldArray'

import { WebhookFormValues } from './EditHookPanel.constants'
import { buildEdgeFunctionHeaderAddActions } from '@/components/interfaces/Functions/httpHeaderAddActions'
import { ApiKeysAccessNote } from '@/components/ui/ApiKeysAccessNote'
import {
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from '@/components/ui/Forms/FormSection'
import { getKeys, revealedApiKeysQueryOptions } from '@/data/api-keys/api-keys-query'
import { useGrant } from '@/lib/grants'
import { uuidv4 } from '@/lib/helpers'

interface HTTPHeadersProps {
  form: UseFormReturn<WebhookFormValues>
}

export const HTTPHeaders = ({ form }: HTTPHeadersProps) => {
  const { ref } = useParams()
  const apiKeysGrant = useGrant(
    'GET /v1/projects/{ref}/api-keys',
    { projectRef: ref },
    { variant: 'reveal' }
  )
  const { data: apiKeyData } = useQuery(
    revealedApiKeysQueryOptions({ projectRef: ref, grant: apiKeysGrant.grant }, { select: getKeys })
  )
  const { serviceKey, secretKey } = apiKeyData ?? {}
  const apiKey = secretKey?.api_key ?? serviceKey?.api_key ?? '[YOUR API KEY]'

  const functionType = useWatch({ control: form.control, name: 'function_type' })
  const addActions =
    functionType === 'supabase_function'
      ? buildEdgeFunctionHeaderAddActions({
          apiKey,
          createRow: (name: string, value: string) => ({ id: uuidv4(), name, value }),
        })
      : []

  return (
    <FormSection
      header={<FormSectionLabel className="lg:col-span-4!">HTTP Headers</FormSectionLabel>}
    >
      <FormSectionContent loading={false} className="lg:col-span-8!">
        <KeyValueFieldArray
          control={form.control}
          name="httpHeaders"
          keyFieldName="name"
          valueFieldName="value"
          createEmptyRow={() => ({ id: uuidv4(), name: '', value: '' })}
          keyPlaceholder="Header name"
          valuePlaceholder="Header value"
          addLabel="Add header"
          addActions={addActions}
        />
        {functionType === 'supabase_function' && (
          <ApiKeysAccessNote
            grant={apiKeysGrant}
            fallback="The Authorization header uses a placeholder you can replace."
          />
        )}
      </FormSectionContent>
    </FormSection>
  )
}
