import { useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertCircle,
  Modal,
} from 'ui'

import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'

export const ProtectedSchemaModal = ({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) => {
  return (
    <Modal
      size="medium"
      visible={visible}
      header="Schemas managed by Supabase"
      customFooter={
        <div className="flex items-center justify-end space-x-2">
          <Button type="default" onClick={() => onClose()}>
            Understood
          </Button>
        </div>
      }
      onCancel={() => onClose()}
    >
      <Modal.Content className="space-y-2">
        <p className="text-sm">
          The following schemas are managed by Supabase and are currently protected from write
          access through the dashboard.
        </p>
        <div className="flex flex-wrap gap-1">
          {EXCLUDED_SCHEMAS.map((schema) => (
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
      </Modal.Content>
    </Modal>
  )
}

const ProtectedSchemaWarning = ({ schema, entity }: { schema: string; entity: string }) => {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Alert_Shadcn_>
        <IconAlertCircle strokeWidth={2} />
        <AlertTitle_Shadcn_>Currently viewing {entity} from a protected schema</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>
          <p className="mb-2">
            The <code className="text-xs">{schema}</code> schema is managed by Supabase and is
            read-only through the dashboard.
          </p>
          <Button type="default" size="tiny" onClick={() => setShowModal(true)}>
            Learn more
          </Button>
        </AlertDescription_Shadcn_>
      </Alert_Shadcn_>
      <ProtectedSchemaModal visible={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}

export default ProtectedSchemaWarning
