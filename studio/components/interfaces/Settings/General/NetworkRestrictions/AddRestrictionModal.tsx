import { FC } from 'react'
import ipaddr from 'ipaddr.js'
import { Alert, Button, Form, Input, Modal } from 'ui'

import { useStore, useParams } from 'hooks'
import { useNetworkRestrictionsApplyMutation } from 'data/network-restrictions/network-retrictions-apply-mutation'

interface Props {
  restrictedIps: string[]
  visible: boolean
  hasOverachingRestriction: boolean
  onClose: () => void
}

const AddRestrictionModal: FC<Props> = ({
  restrictedIps,
  visible,
  hasOverachingRestriction,
  onClose,
}) => {
  const formId = 'add-restriction-form'
  const { ui } = useStore()
  const { ref } = useParams()
  const { mutateAsync: applyNetworkRestrictions } = useNetworkRestrictionsApplyMutation()

  const validate = (values: any) => {
    const errors: any = {}

    try {
      // Check if already exists
      const alreadyExists = restrictedIps.includes(values.address)
      if (alreadyExists) {
        errors.address = 'This restriction already exists'
        return errors
      }
      // Check if valid IP address
      const [address, range] = ipaddr.IPv4.parseCIDR(values.address)
      // Check if private range
      const isPrivate = ipaddr.parse(address.octets.join('.')).range() === 'private'
      if (isPrivate) errors.address = 'Private IP addresses are not supported'
    } catch (error: any) {
      if (error.message.includes('string is not formatted like an IPv4 CIDR range')) {
        try {
          // Check if IPv6 format
          ipaddr.IPv6.parseCIDR(values.address)
          errors.address = 'Only IPv4 addresses are supported at the moment'
        } catch (error: any) {
          errors.address = 'Please enter a valid address in CIDR notation'
        }
      }
    }
    return errors
  }

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    if (!ref) return console.error('Project ref is required')

    setSubmitting(true)
    const dbAllowedCidrs = hasOverachingRestriction
      ? [values.address]
      : [...restrictedIps, values.address]

    try {
      await applyNetworkRestrictions({ projectRef: ref, dbAllowedCidrs })
      onClose()
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to add restriction: ${error.message}`,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      closable
      hideFooter
      size="small"
      visible={visible}
      onCancel={onClose}
      header="Add a new restriction"
    >
      <Form
        validateOnBlur
        id={formId}
        className="!border-t-0"
        initialValues={{ address: '' }}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ isSubmitting }: any) => {
          return (
            <>
              <Modal.Content>
                <div className="py-6 space-y-4">
                  <p className="text-sm text-scale-1100">
                    This will add an IP address range to a list of allowed ranges that can access
                    your project's database.
                  </p>
                  <Input
                    label="IPv4 address in CIDR notation"
                    id="address"
                    name="address"
                    placeholder="0.0.0.0/0"
                  />
                </div>
              </Modal.Content>
              <div className="flex items-center justify-end px-6 py-4 border-t space-x-2">
                <Button type="default" disabled={isSubmitting} onClick={() => onClose()}>
                  Cancel
                </Button>
                <Button htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
                  Save restriction
                </Button>
              </div>
            </>
          )
        }}
      </Form>
    </Modal>
  )
}

export default AddRestrictionModal
