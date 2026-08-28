import { useParams } from 'common'
import { Loader2, Plus } from 'lucide-react'
import { ControllerRenderProps } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { useReplicationPublicationsQuery } from '@/data/replication/publications-query'

const CREATE_PUBLICATION_VALUE = '__create_publication__'

interface PublicationSelectProps {
  sourceId?: number
  field: ControllerRenderProps<DestinationPanelSchemaType, 'publicationName'>
  onNewPublicationClick: () => void
}

export const PublicationSelect = ({
  sourceId,
  field,
  onNewPublicationClick,
}: PublicationSelectProps) => {
  const { ref: projectRef } = useParams()
  const selectedPublication = field.value ?? ''

  const {
    data: publications = [],
    isPending,
    isFetching,
    refetch: refetchPublications,
  } = useReplicationPublicationsQuery({ projectRef, sourceId })
  const isLoadingPublications = isPending || isFetching
  const showLoadingState = isLoadingPublications && publications.length === 0

  return (
    <Select
      value={selectedPublication || undefined}
      onValueChange={(value) => {
        if (value === CREATE_PUBLICATION_VALUE) {
          onNewPublicationClick()
          return
        }

        field.onChange(value)
      }}
      onOpenChange={(open) => {
        if (open) {
          if (typeof projectRef !== 'undefined' && typeof sourceId !== 'undefined') {
            refetchPublications()
          }
        }

        if (!open) {
          field.onBlur()
        }
      }}
    >
      <SelectTrigger name={field.name} disabled={showLoadingState}>
        {showLoadingState ? (
          <span className="flex items-center gap-2 text-foreground-lighter">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading publications...
          </span>
        ) : (
          selectedPublication || 'Select publication'
        )}
      </SelectTrigger>
      <SelectContent>
        {showLoadingState ? (
          <div className="p-2">
            <GenericSkeletonLoader className="w-full" />
          </div>
        ) : (
          <>
            {publications.length === 0 ? (
              <div className="text-foreground-lighter text-xs py-3 px-2 space-y-0.5">
                <p>No publications available</p>
                <p className="text-foreground-muted">Publications with no tables are hidden</p>
              </div>
            ) : (
              publications.map((pub) => (
                <SelectItem key={pub.name} value={pub.name} className="[&>span]:top-2.5">
                  <p>{pub.name}</p>
                  <p className="text-foreground-lighter">
                    {pub.tables.length} {pub.tables.length === 1 ? 'table' : 'tables'}
                  </p>
                </SelectItem>
              ))
            )}

            <SelectSeparator />

            <SelectItem value={CREATE_PUBLICATION_VALUE} className="[&>span]:top-2.5">
              <p className="flex items-center gap-2">
                <Plus size={14} strokeWidth={1.5} />
                New publication
              </p>
            </SelectItem>
          </>
        )}
      </SelectContent>
    </Select>
  )
}
