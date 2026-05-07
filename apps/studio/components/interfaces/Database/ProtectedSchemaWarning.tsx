import { useState } from 'react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'

import { INTERNAL_SCHEMAS, useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { Admonition } from 'ui-patterns'

export const ProtectedSchemaDialog = ({ onClose }: { onClose: () => void }) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Schemas managed by Supabase</DialogTitle>
      </DialogHeader>
      <DialogSectionSeparator />
      <DialogSection className="space-y-2 prose">
        <p className="text-sm">
          The following schemas are managed by Supabase and are currently protected from write
          access through the dashboard.
        </p>
        <div className="flex flex-wrap gap-1">
          {INTERNAL_SCHEMAS.map((schema) => (
            <code key={schema} className="text-xs">
              {schema}
            </code>
          ))}
        </div>
        <p className="text-sm !mt-4">
          These schemas are critical to the functionality of your Supabase project and hence we
          highly recommend not altering them.
        </p>
        <p className="text-sm">
          You can, however, still interact with those schemas through the SQL Editor although we
          advise you only do so if you know what you are doing.
        </p>
      </DialogSection>
      <DialogFooter>
        <div className="flex items-center justify-end space-x-2">
          <Button type="default" onClick={onClose}>
            Understood
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}

export const ProtectedSchemaWarning = ({
  size = 'md',
  schema,
  entity,
}: {
  size?: 'sm' | 'md'
  schema: string
  entity: string
}) => {
  const [showModal, setShowModal] = useState(false)
  const { isSchemaLocked, reason, fdwType } = useIsProtectedSchema({ schema })

  if (!isSchemaLocked) return null

  const showLearnMoreDialog =
    reason !== 'fdw' || (fdwType !== 'iceberg' && fdwType !== 's3_vectors')

  return (
    <Admonition
      showIcon={size === 'sm' ? false : true}
      layout={size === 'sm' ? 'vertical' : 'horizontal'}
      type="note"
      title={
        size === 'sm' ? `Viewing protected schema` : `Viewing ${entity} from a protected schema`
      }
      description={
        reason === 'fdw' && fdwType === 'iceberg' ? (
          <p>
            The <code className="text-code-inline">{schema}</code> schema is used by Supabase to
            connect to analytics buckets and is read-only through the dashboard.
          </p>
        ) : reason === 'fdw' && fdwType === 's3_vectors' ? (
          <p>
            The <code className="text-code-inline">{schema}</code> schema is used by Supabase to
            connect to vector buckets and is read-only through the dashboard.
          </p>
        ) : (
          <p>
            The <code className="text-code-inline">{schema}</code> schema is managed by Supabase and
            is read-only through the dashboard.
          </p>
        )
      }
      actions={
        showLearnMoreDialog && (
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button type="default" size="tiny" onClick={() => setShowModal(true)}>
                Learn more
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ProtectedSchemaDialog onClose={() => setShowModal(false)} />
            </DialogContent>
          </Dialog>
        )
      }
    />
  )
}
