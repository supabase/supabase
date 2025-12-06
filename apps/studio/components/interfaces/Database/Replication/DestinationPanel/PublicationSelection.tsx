import { useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { useCheckPrimaryKeysExists } from 'data/database/primary-keys-exists-query'
import { useReplicationPublicationsQuery } from 'data/replication/publications-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { FormControl_Shadcn_, FormField_Shadcn_ } from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { PublicationsComboBox } from '../PublicationsComboBox'
import type { DestinationPanelSchemaType } from './DestinationPanel.schema'

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
  const { data: project } = useSelectedProjectQuery()
  const { publicationName } = form.watch()

  const {
    data: publications = [],
    isLoading: isLoadingPublications,
    isSuccess: isSuccessPublications,
  } = useReplicationPublicationsQuery({ projectRef, sourceId })

  const publicationNames = useMemo(() => publications?.map((pub) => pub.name) ?? [], [publications])
  const selectedPublication = publications.find((pub) => pub.name === publicationName)
  const isSelectedPublicationMissing =
    isSuccessPublications && !!publicationName && !publicationNames.includes(publicationName)

  const { data: checkPrimaryKeysExistsData, isLoading: isLoadingCheck } = useCheckPrimaryKeysExists(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      tables: selectedPublication?.tables ?? [],
    },
    { enabled: visible && !!selectedPublication }
  )
  const hasTablesWithNoPrimaryKeys = (checkPrimaryKeysExistsData?.offendingTables ?? []).length > 0

  return (
    <>
      <FormField_Shadcn_
        control={form.control}
        name="publicationName"
        render={({ field }) => (
          <FormItemLayout
            label="Publication"
            layout="vertical"
            description="Choose which tables to replicate to this destination"
          >
            <FormControl_Shadcn_>
              <PublicationsComboBox
                publications={publicationNames}
                isLoadingPublications={isLoadingPublications}
                isLoadingCheck={!!selectedPublication && isLoadingCheck}
                field={field}
                onNewPublicationClick={() => onSelectNewPublication()}
              />
            </FormControl_Shadcn_>
            {isSelectedPublicationMissing ? (
              <Admonition type="warning" className="mt-2">
                <p className="!leading-normal">
                  The publication <strong className="text-foreground">{publicationName}</strong> was
                  not found, it may have been renamed or deleted, please select another one.
                </p>
              </Admonition>
            ) : hasTablesWithNoPrimaryKeys ? (
              <Admonition type="warning" className="mt-2">
                <p className="!leading-normal">
                  Replication requires every table in the publication to have a primary key to work,
                  which these tables are missing:
                </p>
                <ul className="list-disc pl-6 mb-2">
                  {(checkPrimaryKeysExistsData?.offendingTables ?? []).map((x) => {
                    const value = `${x.schema}.${x.name}`
                    return (
                      <li key={value} className="!leading-normal">
                        <InlineLink href={`/project/${projectRef}/editor/${x.id}`}>
                          {value}
                        </InlineLink>
                      </li>
                    )
                  })}
                </ul>
                <p className="!leading-normal">Ensure that these tables have primary keys first.</p>
              </Admonition>
            ) : null}
          </FormItemLayout>
        )}
      />
    </>
  )
}
