import * as Tooltip from '@radix-ui/react-tooltip'
import { useParams } from 'common'
import { toast } from 'sonner'
import { Button, Form, Input, Modal } from 'ui'

import InformationBox from 'components/ui/InformationBox'
import { useNetworkRestrictionsQuery } from 'data/network-restrictions/network-restrictions-query'
import { useNetworkRestrictionsApplyMutation } from 'data/network-restrictions/network-retrictions-apply-mutation'
import {
  checkIfPrivate,
  getAddressEndRange,
  isValidAddress,
  normalize,
} from './NetworkRestrictions.utils'
import { HelpCircle } from 'lucide-react'

const IPV4_MAX_CIDR_BLOCK_SIZE = 32
const IPV6_MAX_CIDR_BLOCK_SIZE = 128

interface AddRestrictionModalProps {
  type?: 'IPv4' | 'IPv6'
  hasOverachingRestriction: boolean
  onClose: () => void
}

const AddRestrictionModal = ({
  type,
  hasOverachingRestriction,
  onClose,
}: AddRestrictionModalProps) => {
  const formId = 'add-restriction-form'
  const { ref } = useParams()

  const { data } = useNetworkRestrictionsQuery({ projectRef: ref })
  const ipv4Restrictions = data?.config?.dbAllowedCidrs ?? []
  // @ts-ignore [Joshen] API typing issue
  const ipv6Restrictions = data?.config?.dbAllowedCidrsV6 ?? []
  const restrictedIps = ipv4Restrictions.concat(ipv6Restrictions)

  const { mutate: applyNetworkRestrictions, isLoading: isApplying } =
    useNetworkRestrictionsApplyMutation({
      onSuccess: () => {
        toast.success('Successfully added restriction')
        onClose()
      },
    })

  const validate = (values: any) => {
    const errors: any = {}

    if (type === undefined) return errors

    const { ipAddress, cidrBlockSize } = values

    // Validate CIDR block size
    const isOutOfCidrSizeRange =
      type === 'IPv4'
        ? cidrBlockSize < 0 || cidrBlockSize > IPV4_MAX_CIDR_BLOCK_SIZE
        : cidrBlockSize < 0 || cidrBlockSize > IPV6_MAX_CIDR_BLOCK_SIZE
    if (cidrBlockSize.length === 0 || isOutOfCidrSizeRange) {
      errors.cidrBlockSize = `Size has to be between 0 to ${
        type === 'IPv4' ? IPV4_MAX_CIDR_BLOCK_SIZE : IPV6_MAX_CIDR_BLOCK_SIZE
      }`
    }

    // Validate IP address
    const isValid = isValidAddress(ipAddress)
    if (!isValid) {
      errors.ipAddress = 'Please enter a valid IP address'
      return errors
    }

    try {
      const isPrivate = checkIfPrivate(type, ipAddress)
      if (isPrivate) errors.ipAddress = 'Private IP addresses are not supported'
    } catch (error: any) {
      errors.ipAddress = error.message
    }

    return errors
  }

  const onSubmit = async (values: any) => {
    if (!ref) return console.error('Project ref is required')

    const address = `${values.ipAddress}/${values.cidrBlockSize}`
    const normalizedAddress = normalize(address)

    const alreadyExists =
      restrictedIps.includes(address) || restrictedIps.includes(normalizedAddress)
    if (alreadyExists) {
      return toast(`The address ${address} is already restricted`)
    }

    // Need to replace over arching restriction (allow all / disallow all)
    if (hasOverachingRestriction) {
      const dbAllowedCidrs = type === 'IPv4' ? [normalizedAddress] : []
      const dbAllowedCidrsV6 = type === 'IPv6' ? [normalizedAddress] : []
      applyNetworkRestrictions({ projectRef: ref, dbAllowedCidrs, dbAllowedCidrsV6 })
    } else {
      const dbAllowedCidrs =
        type === 'IPv4' ? [...ipv4Restrictions, normalizedAddress] : ipv4Restrictions
      const dbAllowedCidrsV6 =
        type === 'IPv6' ? [...ipv6Restrictions, normalizedAddress] : ipv6Restrictions
      applyNetworkRestrictions({ projectRef: ref, dbAllowedCidrs, dbAllowedCidrsV6 })
    }
  }

  return (
    <Modal
      hideFooter
      size="medium"
      visible={type !== undefined}
      onCancel={onClose}
      header={`Add a new ${type} restriction`}
    >
      <Form
        validateOnBlur
        id={formId}
        className="!border-t-0"
        initialValues={{
          ipAddress: '',
          cidrBlockSize:
            type === 'IPv4'
              ? IPV4_MAX_CIDR_BLOCK_SIZE.toString()
              : IPV6_MAX_CIDR_BLOCK_SIZE.toString(),
        }}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ values }: any) => {
          const isPrivate =
            type !== undefined && isValidAddress(values.ipAddress)
              ? checkIfPrivate(type, values.ipAddress)
              : false
          const isValidBlockSize =
            values.cidrBlockSize !== '' &&
            ((type === 'IPv4' &&
              values.cidrBlockSize >= 0 &&
              values.cidrBlockSize <= IPV4_MAX_CIDR_BLOCK_SIZE) ||
              (type === 'IPv6' &&
                values.cidrBlockSize >= 0 &&
                values.cidrBlockSize <= IPV6_MAX_CIDR_BLOCK_SIZE))
          const availableAddresses =
            type === 'IPv4'
              ? Math.pow(2, IPV4_MAX_CIDR_BLOCK_SIZE - (values?.cidrBlockSize ?? 0))
              : Math.pow(2, IPV6_MAX_CIDR_BLOCK_SIZE - (values?.cidrBlockSize ?? 0))
          const addressRange =
            type !== undefined
              ? getAddressEndRange(type, `${values.ipAddress}/${values.cidrBlockSize}`)
              : undefined

          const isValidCIDR = isValidBlockSize && !isPrivate && addressRange !== undefined
          const normalizedAddress = isValidCIDR
            ? normalize(`${values.ipAddress}/${values.cidrBlockSize}`)
            : `${values.ipAddress}/${values.cidrBlockSize}`

          return (
            <>
              <Modal.Content className="space-y-4">
                <p className="text-sm text-foreground-light">
                  This will add an IP address range to a list of allowed ranges that can access your
                  database.
                </p>
                <InformationBox
                  title="Note: Restrictions only apply to direct connections to your database and Supavisor"
                  description="They do not currently apply to APIs offered over HTTPS, such as PostgREST, Storage, or Authentication."
                  urlLabel="Learn more"
                  url="https://supabase.com/docs/guides/platform/network-restrictions#limitations"
                />
                <div className="flex space-x-4">
                  <div className="w-[55%]">
                    <Input
                      label={`${type} address`}
                      id="ipAddress"
                      name="ipAddress"
                      placeholder={type === 'IPv4' ? '0.0.0.0' : '::0'}
                    />
                  </div>
                  <div className="flex-grow">
                    <Input
                      label={
                        <div className="flex items-center space-x-2">
                          <p>CIDR Block Size</p>
                          <Tooltip.Root delayDuration={0}>
                            <Tooltip.Trigger>
                              <HelpCircle size="14" strokeWidth={2} />
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content side="bottom">
                                <Tooltip.Arrow className="radix-tooltip-arrow" />
                                <div
                                  className={[
                                    'rounded bg-alternative py-1 px-2 leading-none shadow',
                                    'border border-background w-[300px]',
                                  ].join(' ')}
                                >
                                  <span className="text-xs text-foreground">
                                    Classless inter-domain routing (CIDR) notation is the notation
                                    used to identify networks and hosts in the networks. The block
                                    size tells us how many bits we need to take for the network
                                    prefix, and is a value between 0 to{' '}
                                    {type === 'IPv4'
                                      ? IPV4_MAX_CIDR_BLOCK_SIZE
                                      : IPV6_MAX_CIDR_BLOCK_SIZE}
                                    .
                                  </span>
                                </div>
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </div>
                      }
                      id="cidrBlockSize"
                      name="cidrBlockSize"
                      type="number"
                      placeholder={
                        type === 'IPv4'
                          ? IPV4_MAX_CIDR_BLOCK_SIZE.toString()
                          : IPV6_MAX_CIDR_BLOCK_SIZE.toString()
                      }
                      min={0}
                      max={type === 'IPv4' ? IPV4_MAX_CIDR_BLOCK_SIZE : IPV6_MAX_CIDR_BLOCK_SIZE}
                    />
                  </div>
                </div>
              </Modal.Content>
              <Modal.Separator />
              {isValidCIDR ? (
                <Modal.Content className="space-y-1">
                  <p className="text-sm">
                    The address range <code className="text-xs">{normalizedAddress}</code> will be
                    restricted
                  </p>
                  <p className="text-sm text-foreground-light">
                    Selected address space: <code className="text-xs">{addressRange.start}</code> to{' '}
                    <code className="text-xs">{addressRange.end}</code>{' '}
                  </p>
                  <p className="text-sm text-foreground-light">
                    Number of addresses: {availableAddresses}
                  </p>
                </Modal.Content>
              ) : (
                <Modal.Content>
                  <div className="h-[68px] flex items-center">
                    <p className="text-sm text-foreground-light">
                      A summary of your restriction will be shown here after entering a valid IP
                      address and CIDR block size. IP addresses will also be normalized.
                    </p>
                  </div>
                </Modal.Content>
              )}
              <Modal.Separator />
              <Modal.Content className="flex items-center justify-end space-x-2">
                <Button type="default" disabled={isApplying} onClick={() => onClose()}>
                  Cancel
                </Button>
                <Button htmlType="submit" loading={isApplying} disabled={isApplying}>
                  Save restriction
                </Button>
              </Modal.Content>
            </>
          )
        }}
      </Form>
    </Modal>
  )
}

export default AddRestrictionModal
