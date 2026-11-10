import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { useFormContext } from 'react-hook-form'
import { FormLabel, SheetSection } from 'ui'
import { KeyValueFieldArray } from 'ui-patterns/form/KeyValueFieldArray/KeyValueFieldArray'

import { CreateCronJobForm } from './CreateCronJobSheet/CreateCronJobSheet.constants'
import { buildEdgeFunctionHeaderAddActions } from '@/components/interfaces/Functions/httpHeaderAddActions'
import { ApiKeysAccessNote } from '@/components/ui/ApiKeysAccessNote'
import { getKeys, revealedApiKeysQueryOptions } from '@/data/api-keys/api-keys-query'
import { useGrant } from '@/lib/grants'

interface HTTPHeaderFieldsSectionProps {
  variant: 'edge_function' | 'http_request'
}

export const HTTPHeaderFieldsSection = ({ variant }: HTTPHeaderFieldsSectionProps) => {
  const form = useFormContext<CreateCronJobForm>()

  const { ref } = useParams()
  const apiKeysGrant = useGrant(
    'GET /v1/projects/{ref}/api-keys',
    { projectRef: ref },
    { variant: 'reveal' }
  )
  const { data: apiKeysData } = useQuery(
    revealedApiKeysQueryOptions({ projectRef: ref, grant: apiKeysGrant.grant }, { select: getKeys })
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
      {variant === 'edge_function' && (
        <ApiKeysAccessNote
          grant={apiKeysGrant}
          fallback="The Authorization header uses a placeholder you can replace."
        />
      )}
    </SheetSection>
  )
}
