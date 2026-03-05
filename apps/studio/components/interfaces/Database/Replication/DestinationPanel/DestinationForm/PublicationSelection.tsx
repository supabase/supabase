import { useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { useParams } from 'common'
import { useReplicationPublicationsQuery } from 'data/replication/publications-query'
import { FormControl_Shadcn_, FormField_Shadcn_ } from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { PublicationsComboBox } from './PublicationsComboBox'

type PublicationSelectionProps = {
  form: UseFormReturn<DestinationPanelSchemaType>
  sourceId?: number
  visible: boolean
  onSelectNewPublication: () => void
}

export const PublicationSelection = ({
  form,
  sourceId,
  visible,
  onSelectNewPublication,
}: PublicationSelectionProps) => {
  const { ref: projectRef } = useParams()
  const { publicationName } = form.watch()

  const {
    data: publications = [],
    isPending: isLoadingPublications,
    isSuccess: isSuccessPublications,
  } = useReplicationPublicationsQuery({ projectRef, sourceId })

  const publicationNames = useMemo(() => publications?.map((pub) => pub.name) ?? [], [publications])
  const isSelectedPublicationMissing =
    isSuccessPublications && !!publicationName && !publicationNames.includes(publicationName)

  return (
    <FormField_Shadcn_
      control={form.control}
      name="publicationName"
      render={({ field }) => (
        <FormItemLayout
          layout="horizontal"
          label="Publication"
          description="Tables in the selected publication will be replicated to this destination"
        >
          <FormControl_Shadcn_>
            <PublicationsComboBox
              publications={publications}
              isLoadingPublications={isLoadingPublications}
              field={field}
              onNewPublicationClick={() => onSelectNewPublication()}
            />
          </FormControl_Shadcn_>
          {isSelectedPublicationMissing && (
            <Admonition type="warning" className="mt-2">
              <p className="!leading-normal">
                The publication <strong className="text-foreground">{publicationName}</strong> was
                not found, it may have been renamed or deleted, please select another one.
              </p>
            </Admonition>
          )}
        </FormItemLayout>
      )}
    />
  )
}
