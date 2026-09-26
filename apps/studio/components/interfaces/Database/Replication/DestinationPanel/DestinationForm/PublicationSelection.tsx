import { useParams } from 'common'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { FormControl, FormField } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { PublicationsComboBox } from './PublicationsComboBox'
import { useReplicationPublicationNamesQuery } from '@/data/replication/publication-names-query'
import { useReplicationPublicationQuery } from '@/data/replication/publication-query'
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
  const publicationName = useWatch({ control: form.control, name: 'publicationName' })

  const sourceId = useReplicationSourceId({ projectRef })

  const { data: publications, isSuccess: isSuccessPublications } =
    useReplicationPublicationNamesQuery({ projectRef, sourceId })
  const { data: selectedPublication } = useReplicationPublicationQuery({
    projectRef,
    sourceId,
    publicationName,
  })

  const isSelectedPublicationMissing =
    isSuccessPublications &&
    !!publicationName &&
    !(publications ?? []).some((publication) => publication.name === publicationName)

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
                    // Every per-table selection is scoped to the previously selected
                    // publication's table list, so none of it carries over cleanly to a
                    // different publication — reset it all rather than risk a stale or
                    // coincidentally-matching table id sticking around.
                    form.setValue('tableSyncCopyMode', 'include_all_tables', {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                    form.setValue('tableSyncCopyTableIds', [], {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                    form.setValue('tableOptions', [], {
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
          {selectedPublication !== undefined && (
            <p className="mt-2 text-xs text-foreground-lighter">
              <span className="font-medium text-foreground-light">Partitioned tables: </span>
              {selectedPublication.config.publish_via_partition_root
                ? 'Publish changes as the parent table.'
                : 'Publish changes as individual partitions.'}
            </p>
          )}
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
