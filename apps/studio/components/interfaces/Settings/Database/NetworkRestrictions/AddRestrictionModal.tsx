import { HelpCircle } from 'lucide-react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import { toast } from 'sonner'

import { useParams } from 'common/hooks'
import { useNetworkRestrictionsQuery } from 'data/network-restrictions/network-restrictions-query'
import { useNetworkRestrictionsApplyMutation } from 'data/network-restrictions/network-retrictions-apply-mutation'
import InformationBox from 'components/ui/InformationBox'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  checkIfPrivate,
  getAddressEndRange,
  isValidAddress,
  normalize,
} from './NetworkRestrictions.utils'

const IPV4_MAX_CIDR_BLOCK_SIZE = 32
const IPV6_MAX_CIDR_BLOCK_SIZE = 128

interface AddRestrictionModalProps {
  type?: 'IPv4' | 'IPv6'
  hasOverachingRestriction: boolean
  onClose: () => void
}

const formId = 'add-restriction-form'

export const AddRestrictionModal = ({
  type,
  hasOverachingRestriction,
  onClose,
}: AddRestrictionModalProps) => {
  const { ref } = useParams()

  const { data } = useNetworkRestrictionsQuery({ projectRef: ref }, { enabled: type !== undefined })
  const ipv4Restrictions = data?.config?.dbAllowedCidrs ?? []
  // @ts-ignore [Joshen] API typing issue
  const ipv6Restrictions = data?.config?.dbAllowedCidrsV6 ?? []
  const restrictedIps = ipv4Restrictions.concat(ipv6Restrictions)

  const maxSize = type === 'IPv4' ? IPV4_MAX_CIDR_BLOCK_SIZE : IPV6_MAX_CIDR_BLOCK_SIZE

  const schema = z.object({
    ipAddress: z
      .string()
      .ip({
        version: type === 'IPv4' ? 'v4' : 'v6',
        message: 'Please enter a valid IP address',
      })
      .refine(
        (val) => typeof type !== `undefined` && checkIfPrivate(type, val),
        'Private IP addresses are not supported'
      ),
    cidrBlockSize: z.coerce.number().min(0).max(maxSize, `Size has to be between 0 to ${maxSize}`),
  })

  const initialValues = {
    ipAddress: '',
    cidrBlockSize: maxSize,
  }

  const form = useForm({
    resolver: zodResolver(schema),
    // because we render the modal with an external trigger
    // maxSize initializes to 128 because type is undefined
    defaultValues: initialValues,
    // therefor, when the dialog is opened, this will set the
    // correct default cidrBlockSize
    values: initialValues,
  })

  const { mutate: applyNetworkRestrictions, isLoading: isApplying } =
    useNetworkRestrictionsApplyMutation({
      onSuccess: () => {
        toast.success('Successfully added restriction')
        onClose()
      },
    })

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async ({ ipAddress, cidrBlockSize }) => {
    if (!ref) return console.error('Project ref is required')

    const address = `${ipAddress}/${cidrBlockSize}`
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

  const ipAddress = form.watch('ipAddress')
  const cidrBlockSize = form.watch('cidrBlockSize')
  const isPrivate =
    type !== undefined && isValidAddress(ipAddress) ? checkIfPrivate(type, ipAddress) : false
  const isValidBlockSize =
    (type === 'IPv4' && cidrBlockSize >= 0 && cidrBlockSize <= IPV4_MAX_CIDR_BLOCK_SIZE) ||
    (type === 'IPv6' && cidrBlockSize >= 0 && cidrBlockSize <= IPV6_MAX_CIDR_BLOCK_SIZE)
  const availableAddresses =
    type === 'IPv4'
      ? Math.pow(2, IPV4_MAX_CIDR_BLOCK_SIZE - (cidrBlockSize ?? 0))
      : Math.pow(2, IPV6_MAX_CIDR_BLOCK_SIZE - (cidrBlockSize ?? 0))
  const addressRange =
    type !== undefined ? getAddressEndRange(type, `${ipAddress}/${cidrBlockSize}`) : undefined

  const isValidCIDR = isValidBlockSize && !isPrivate && addressRange !== undefined
  const normalizedAddress = isValidCIDR
    ? normalize(`${ipAddress}/${cidrBlockSize}`)
    : `${ipAddress}/${cidrBlockSize}`

  return (
    <Dialog
      open={type !== undefined}
      onOpenChange={(open) => {
        if (!open) {
          form.reset()
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`Add a new ${type} restriction`}</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-4">
          <p className="text-sm text-foreground-light">
            This will add an IP address range to a list of allowed ranges that can access your
            database.
          </p>
          <InformationBox
            title="Note: Restrictions only apply to direct connections to your database and connection pooler"
            description="They do not currently apply to APIs offered over HTTPS, such as PostgREST, Storage, or Authentication."
            urlLabel="Learn more"
            url="https://supabase.com/docs/guides/platform/network-restrictions#limitations"
          />
          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className="flex space-x-4">
                <div className="w-[55%]">
                  <FormField_Shadcn_
                    key="ipAddress"
                    name="ipAddress"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout name="ipAddress" label={`${type} address`}>
                        <FormControl_Shadcn_>
                          <Input
                            id="ipAddress"
                            placeholder={type === 'IPv4' ? '0.0.0.0' : '::0'}
                            {...field}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </div>
                <div className="flex-grow">
                  <FormField_Shadcn_
                    key="cidrBlockSize"
                    name="cidrBlockSize"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout
                        name="cidrBlockSize"
                        label={
                          <div className="flex items-center space-x-2">
                            <p>CIDR Block Size</p>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle size="14" strokeWidth={2} />
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="w-80">
                                Classless inter-domain routing (CIDR) notation is the notation used
                                to identify networks and hosts in the networks. The block size tells
                                us how many bits we need to take for the network prefix, and is a
                                value between 0 to {maxSize}.
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        }
                      >
                        <FormControl_Shadcn_>
                          <Input
                            id="cidrBlockSize"
                            type="number"
                            min={0}
                            max={maxSize}
                            placeholder={maxSize.toString()}
                            {...field}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogSectionSeparator />
        {isValidCIDR ? (
          <DialogSection className="space-y-1">
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
          </DialogSection>
        ) : (
          <DialogSection>
            <div className="h-[68px] flex items-center">
              <p className="text-sm text-foreground-light">
                A summary of your restriction will be shown here after entering a valid IP address
                and CIDR block size. IP addresses will also be normalized.
              </p>
            </div>
          </DialogSection>
        )}
        <DialogFooter>
          <Button
            type="default"
            disabled={isApplying}
            onClick={() => {
              form.reset()
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button form={formId} htmlType="submit" loading={isApplying}>
            Save restriction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
