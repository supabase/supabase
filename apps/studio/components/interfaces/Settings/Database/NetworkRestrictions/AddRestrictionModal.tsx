import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { HelpCircle } from 'lucide-react'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Modal,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { checkIfPrivate, getAddressEndRange, normalize } from './NetworkRestrictions.utils'
import InformationBox from '@/components/ui/InformationBox'
import { useNetworkRestrictionsQuery } from '@/data/network-restrictions/network-restrictions-query'
import { useNetworkRestrictionsApplyMutation } from '@/data/network-restrictions/network-retrictions-apply-mutation'
import { DOCS_URL } from '@/lib/constants'

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

  const { data } = useNetworkRestrictionsQuery({ projectRef: ref }, { enabled: type !== undefined })
  const ipv4Restrictions = data?.config?.dbAllowedCidrs ?? []
  // @ts-ignore [Joshen] API typing issue
  const ipv6Restrictions = data?.config?.dbAllowedCidrsV6 ?? []
  const restrictedIps = ipv4Restrictions.concat(ipv6Restrictions)

  const { mutate: applyNetworkRestrictions, isPending: isApplying } =
    useNetworkRestrictionsApplyMutation({
      onSuccess: () => {
        toast.success('Successfully added restriction')
        onClose()
      },
    })

  const cidrBlockSizeValidationMessage = `Size has to be between 0 to ${
    type === 'IPv4' ? IPV4_MAX_CIDR_BLOCK_SIZE : IPV6_MAX_CIDR_BLOCK_SIZE
  }`
  const formSchema = z.object({
    cidrBlockSize: z.coerce
      .number()
      .min(0, cidrBlockSizeValidationMessage)
      .max(
        type === 'IPv4' ? IPV4_MAX_CIDR_BLOCK_SIZE : IPV6_MAX_CIDR_BLOCK_SIZE,
        cidrBlockSizeValidationMessage
      ),
    ipAddress: z
      .string()
      .min(1, `Please enter a valid IP address`)
      .ip({
        version: type === 'IPv4' ? 'v4' : 'v6',
        message: `Please enter a valid ${type} address`,
      })
      .refine((val) => !checkIfPrivate(type, val), 'Private IP addresses are not supported'),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ipAddress: '',
      cidrBlockSize: type === 'IPv4' ? IPV4_MAX_CIDR_BLOCK_SIZE : IPV6_MAX_CIDR_BLOCK_SIZE,
    },
  })
  const { reset, formState } = form
  const { errors } = formState

  useEffect(() => {
    reset({
      ipAddress: '',
      cidrBlockSize: type === 'IPv4' ? IPV4_MAX_CIDR_BLOCK_SIZE : IPV6_MAX_CIDR_BLOCK_SIZE,
    })
  }, [type, reset])

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

  const [cidrBlockSize, ipAddress] = useWatch({
    name: ['cidrBlockSize', 'ipAddress'],
    control: form.control,
  })

  const availableAddresses =
    type === 'IPv4'
      ? Math.pow(2, IPV4_MAX_CIDR_BLOCK_SIZE - (cidrBlockSize ?? 0))
      : Math.pow(2, IPV6_MAX_CIDR_BLOCK_SIZE - (cidrBlockSize ?? 0))

  const addressRange =
    type !== undefined ? getAddressEndRange(type, `${ipAddress}/${cidrBlockSize}`) : undefined

  const isValidCIDR =
    errors.cidrBlockSize == null && errors.ipAddress == null && addressRange != null

  const normalizedAddress = isValidCIDR
    ? normalize(`${ipAddress}/${cidrBlockSize}`)
    : `${ipAddress}/${cidrBlockSize}`

  return (
    <Modal
      hideFooter
      size="medium"
      visible={type !== undefined}
      onCancel={onClose}
      header={`Add a new ${type} restriction`}
    >
      <Form_Shadcn_ {...form}>
        <Modal.Content className="space-y-4">
          <p className="text-sm text-foreground-light">
            This will add an IP address range to a list of allowed ranges that can access your
            database.
          </p>
          <InformationBox
            title="Note: Restrictions only apply to direct connections to your database and connection pooler"
            description="They do not currently apply to APIs offered over HTTPS, such as PostgREST, Storage, or Authentication."
            urlLabel="Learn more"
            url={`${DOCS_URL}/guides/platform/network-restrictions#limitations`}
          />
          <form
            id={formId}
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="flex space-x-4"
          >
            <div className="w-[55%]">
              <FormField_Shadcn_
                control={form.control}
                name="ipAddress"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label={`${type} address`}>
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder={type === 'IPv4' ? '0.0.0.0' : '::0'} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </div>
            <div className="flex-grow">
              <FormField_Shadcn_
                control={form.control}
                name="cidrBlockSize"
                render={({ field }) => (
                  <FormItemLayout
                    layout="vertical"
                    label={
                      <div className="flex items-center space-x-2">
                        <p>CIDR Block Size</p>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle size="14" strokeWidth={2} />
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="w-80">
                            Classless inter-domain routing (CIDR) notation is the notation used to
                            identify networks and hosts in the networks. The block size tells us how
                            many bits we need to take for the network prefix, and is a value between
                            0 to{' '}
                            {type === 'IPv4' ? IPV4_MAX_CIDR_BLOCK_SIZE : IPV6_MAX_CIDR_BLOCK_SIZE}.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    }
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        type="number"
                        min={0}
                        max={type === 'IPv4' ? IPV4_MAX_CIDR_BLOCK_SIZE : IPV6_MAX_CIDR_BLOCK_SIZE}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder={
                          type === 'IPv4'
                            ? IPV4_MAX_CIDR_BLOCK_SIZE.toString()
                            : IPV6_MAX_CIDR_BLOCK_SIZE.toString()
                        }
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </div>
          </form>
        </Modal.Content>
        <Modal.Separator />
        {isValidCIDR ? (
          <Modal.Content className="space-y-1">
            <p className="text-sm">
              The address range <code className="text-code-inline">{normalizedAddress}</code> will
              be restricted
            </p>
            <p className="text-sm text-foreground-light">
              Selected address space: <code className="text-code-inline">{addressRange.start}</code>{' '}
              to <code className="text-code-inline">{addressRange.end}</code>{' '}
            </p>
            <p className="text-sm text-foreground-light">
              Number of addresses: {availableAddresses}
            </p>
          </Modal.Content>
        ) : (
          <Modal.Content>
            <div className="h-[68px] flex items-center">
              <p className="text-sm text-foreground-light">
                A summary of your restriction will be shown here after entering a valid IP address
                and CIDR block size. IP addresses will also be normalized.
              </p>
            </div>
          </Modal.Content>
        )}
        <Modal.Separator />
        <Modal.Content className="flex items-center justify-end space-x-2">
          <Button type="default" disabled={isApplying} onClick={() => onClose()}>
            Cancel
          </Button>
          <Button form={formId} htmlType="submit" loading={isApplying} disabled={isApplying}>
            Save restriction
          </Button>
        </Modal.Content>
      </Form_Shadcn_>
    </Modal>
  )
}

export default AddRestrictionModal
