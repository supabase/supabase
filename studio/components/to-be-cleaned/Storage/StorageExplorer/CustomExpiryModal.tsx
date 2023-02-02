import { FC } from 'react'
import { Form, Modal, Input, Button } from 'ui'
import { observer } from 'mobx-react-lite'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'

interface Props {}

const CustomExpiryModal: FC<Props> = () => {
  const storageExplorerStore = useStorageStore()
  const { selectedFileCustomExpiry, setSelectedFileCustomExpiry, copyFileURLToClipboard } =
    storageExplorerStore

  const visible = selectedFileCustomExpiry !== undefined
  const onClose = () => setSelectedFileCustomExpiry(undefined)

  return (
    <Modal
      hideFooter
      size="small"
      header="Custom expiry for signed URL"
      visible={visible}
      alignFooter="right"
      confirmText="Get URL"
      onCancel={() => onClose()}
    >
      <Form
        validateOnBlur
        initialValues={{ expiresIn: '' }}
        onSubmit={async (values: any, { setSubmitting }: any) => {
          setSubmitting(true)
          await copyFileURLToClipboard(selectedFileCustomExpiry, values.expiresIn)
          setSubmitting(false)
          onClose()
        }}
        validate={(values: any) => {
          const errors: any = {}
          if (values.expiresIn !== '' && values.expiresIn <= 0)
            errors.expiresIn = 'Expiry duration cannot be less than 0'
          return errors
        }}
      >
        {({ values, isSubmitting }: { values: any; isSubmitting: boolean }) => (
          <>
            <div className="py-6">
              <Modal.Content>
                <Input
                  disabled={isSubmitting}
                  type="number"
                  id="expiresIn"
                  label="Enter the duration for which the URL will be valid:"
                  actions={<p className="text-sm text-scale-1000 mr-2">seconds</p>}
                />
              </Modal.Content>
            </div>
            <Modal.Separator />
            <Modal.Content>
              <div className="flex items-center justify-end space-x-2 pt-1 pb-3">
                <Button type="default" onClick={() => onClose()}>
                  Cancel
                </Button>
                <Button
                  disabled={values.expiresIn === '' || isSubmitting}
                  loading={isSubmitting}
                  htmlType="submit"
                  type="primary"
                >
                  Get signed URL
                </Button>
              </div>
            </Modal.Content>
          </>
        )}
      </Form>
    </Modal>
  )
}

export default observer(CustomExpiryModal)
