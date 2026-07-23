import { useParams } from 'common'
import { useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { PublicationsComboBox } from './PublicationsComboBox'
import { useReplicationPublicationsQuery } from '@/data/replication/publications-query'
import { useReplicationSourceId } from '@/data/replication/sources-query'

type PublicationSelectionProps = {
  form: UseFormReturn<DestinationPanelSchemaType>
  onSelectNewPublication: () => void
}

export const PublicationSelection = ({
  form,
  onSelectNewPublication,
}: PublicationSelectionProps) => {
  const { ref: projectRef } = useParams()
  const { publicationName } = form.watch()

  const sourceId = useReplicationSourceId({ projectRef })

  const { data: publications, isSuccess: isSuccessPublications } = useReplicationPublicationsQuery({
    projectRef,
    sourceId,
  })

  const publicationNames = useMemo(() => publications?.map((pub) => pub.name) ?? [], [publications])
  const isSelectedPublicationMissing =
    isSuccessPublications && !!publicationName && !publicationNames.includes(publicationName)

  return (
    <FormField
      control={form.control}
      name="publicationName"
      render={({ field }) => (
        <FormItemLayout
          layout="horizontal"
          label="Publication"
          description="Tables in the selected publication will be replicated to this destination."
        >
          <FormControl>
            <PublicationsComboBox
              field={{
                ...field,
                onChange: (value) => {
                  if (value !== field.value) {
                    form.setValue('tableSyncCopyTableIds', [], {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  field.onChange(value)
                },
              }}
              sourceId={sourceId}
              onNewPublicationClick={() => onSelectNewPublication()}
            />
          </FormControl>
          {isSelectedPublicationMissing && (
            <Admonition
              type="warning"
              className="mt-2"
              title={`The publication ${publicationName} was not found.`}
            >
              <p className="leading-normal!">
                It may have been renamed or deleted. Select another publication.
              </p>
            </Admonition>
          )}
        </FormItemLayout>
      )}
    />
  )
}
