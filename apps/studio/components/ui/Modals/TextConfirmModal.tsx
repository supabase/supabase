import { PropsWithChildren, ReactNode } from 'react'
import { Alert, Button, Form, Input, Modal } from 'ui'

interface TextConfirmModalProps {
  loading: boolean
  visible: boolean
  title: string
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge'
  confirmLabel: string
  confirmPlaceholder: string
  confirmString: string
  alert?: string
  text?: string | ReactNode
  onConfirm: () => void
  onCancel: () => void
}

const TextConfirmModal = ({
  title,
  size = 'small',
  onConfirm,
  visible,
  onCancel,
  loading,
  confirmLabel,
  confirmPlaceholder,
  confirmString,
  alert,
  text,
  children,
}: PropsWithChildren<TextConfirmModalProps>) => {
  // [Joshen] Have to keep the loading prop here as this component itself doesn't
  // directly trigger any potential async job that follows onConfirm. It only triggers
  // the onConfirm callback function, and hence if anything fails in the callback,
  // have to depend on loading prop to unfreeze the UI state

  const validate = (values: any) => {
    const errors: any = {}
    if (values.confirmValue.length === 0) {
      errors.confirmValue = 'Enter the required value.'
    } else if (values.confirmValue !== confirmString) {
      errors.confirmValue = 'Value entered does not match.'
    }
    return errors
  }

  return (
    <Modal hideFooter closable size={size} visible={visible} header={title} onCancel={onCancel}>
      <Form
        validateOnBlur
        initialValues={{ confirmValue: '' }}
        validate={validate}
        onSubmit={onConfirm}
      >
        {() => (
          <div className="w-full py-4">
            <div className="space-y-4">
              {children && (
                <>
                  <Modal.Content>{children}</Modal.Content>
                  <Modal.Separator />
                </>
              )}
              {alert && (
                <Modal.Content>
                  <Alert variant="warning" withIcon title={alert} />
                </Modal.Content>
              )}
              {text !== undefined && (
                <Modal.Content>
                  <p className="mb-2 block text-sm break-all">{text}</p>
                </Modal.Content>
              )}
              <Modal.Separator />
              <Modal.Content>
                <Input
                  id="confirmValue"
                  label={
                    <span>
                      Type <span className="text-foreground break-all">{confirmString}</span> to
                      confirm.
                    </span>
                  }
                  placeholder={confirmPlaceholder}
                />
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <Button
                  block
                  type="danger"
                  size="medium"
                  htmlType="submit"
                  loading={loading}
                  disabled={loading}
                >
                  {confirmLabel}
                </Button>
              </Modal.Content>
            </div>
          </div>
        )}
      </Form>
    </Modal>
  )
}

export default TextConfirmModal
