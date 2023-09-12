import { Form, Modal, Input, Button, Listbox } from 'ui'
import { observer } from 'mobx-react-lite'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'

export interface CustomExpiryModalProps {
  onCopyUrl: (name: string, url: string) => void
}

const unitMap: { seconds: number; days: number; months: number; years: number } = {
  seconds: 1,
  days: 3600 * 24,
  months: 3600 * 24 * 30,
  years: 3600 * 24 * 365,
}

const CustomExpiryModal = ({ onCopyUrl }: CustomExpiryModalProps) => {
  const storageExplorerStore = useStorageStore()
  const { getFileUrl, selectedFileCustomExpiry, setSelectedFileCustomExpiry } = storageExplorerStore

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
        initialValues={{ expiresIn: '', units: 'seconds' }}
        onSubmit={async (values: any, { setSubmitting }: any) => {
          setSubmitting(true)
          onCopyUrl(
            selectedFileCustomExpiry.name,
            await getFileUrl(
              selectedFileCustomExpiry,
              values.expiresIn * unitMap[values.units as 'seconds' | 'days' | 'months' | 'years']
            )
          )
          setSubmitting(false)
          onClose()
        }}
        validate={(values: any) => {
          const errors: any = {}
          if (values.expiresIn !== '' && values.expiresIn <= 0) {
            errors.expiresIn = 'Expiry duration cannot be less than 0'
          }
          return errors
        }}
      >
        {({ values, isSubmitting }: { values: any; isSubmitting: boolean }) => (
          <>
            <div className="pt-4 pb-2">
              <Modal.Content>
                <p className="text-sm text-light mb-2">
                  Enter the duration for which the URL will be valid for:
                </p>
                <div className="flex items-center space-x-2">
                  <Input disabled={isSubmitting} type="number" id="expiresIn" className="w-full" />
                  <Listbox id="units" className="w-[150px]">
                    <Listbox.Option id="seconds" label="seconds" value="seconds">
                      seconds
                    </Listbox.Option>
                    <Listbox.Option id="days" label="days" value="days">
                      days
                    </Listbox.Option>
                    <Listbox.Option id="months" label="months" value="months">
                      months
                    </Listbox.Option>
                    <Listbox.Option id="years" label="years" value="years">
                      years
                    </Listbox.Option>
                  </Listbox>
                </div>
                {values.units !== 'seconds' && (
                  <p className="text-sm text-light mt-2">
                    Equivalent to{' '}
                    {values.expiresIn *
                      unitMap[values.units as 'seconds' | 'days' | 'months' | 'years']}{' '}
                    seconds
                  </p>
                )}
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
