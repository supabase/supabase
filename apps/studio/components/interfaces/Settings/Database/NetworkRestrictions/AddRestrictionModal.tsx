import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { HelpCircleIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  Input,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { checkIfPrivate, getAddressEndRange, normalize } from './NetworkRestrictions.utils'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import InformationBox from '@/components/ui/InformationBox'
import { useNetworkRestrictionsQuery } from '@/data/network-restrictions/network-restrictions-query'
import { useNetworkRestrictionsApplyMutation } from '@/data/network-restrictions/network-retrictions-apply-mutation'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { DOCS_URL } from '@/lib/constants'

const IPV4_MAX_CIDR_BLOCK_SIZE = 32
const IPV6_MAX_CIDR_BLOCK_SIZE = 128

type RestrictionType = 'IPv4' | 'IPv6'

const getMaxCidrBlockSize = (type: RestrictionType | undefined) =>
  type === 'IPv6' ? IPV6_MAX_CIDR_BLOCK_SIZE : IPV4_MAX_CIDR_BLOCK_SIZE

const getFormSchema = (type: RestrictionType | undefined) => {
  const maxCidrBlockSize = getMaxCidrBlockSize(type)
  const cidrBlockSizeValidationMessage = `Size has to be between 0 to ${maxCidrBlockSize}`

  return z.object({
    cidrBlockSize: z
      .union([
        z.literal(''),
        z.coerce
          .number()
          .min(0, cidrBlockSizeValidationMessage)
          .max(maxCidrBlockSize, cidrBlockSizeValidationMessage),
      ])
      .refine((value) => value !== '', 'Size is required'),
    ipAddress: z
      .string()
      .min(1, `Please enter a valid IP address`)
      .ip({
        version: type === 'IPv4' ? 'v4' : 'v6',
        message: `Please enter a valid ${type} address`,
      })
      .refine((val) => !checkIfPrivate(type, val), 'Private IP addresses are not supported'),
  })
}

type FormValues = z.infer<ReturnType<typeof getFormSchema>>

interface AddRestrictionModalProps {
  type?: RestrictionType
  hasOverachingRestriction: boolean
  onClose: () => void
}

export const AddRestrictionModal = ({
  type,
  hasOverachingRestriction,
  onClose,
}: AddRestrictionModalProps) => {
  const { ref } = useParams()

  // Normalized addresses that have been added to the list, pending save
  const [stagedAddresses, setStagedAddresses] = useState<string[]>([])

  const { data } = useNetworkRestrictionsQuery({ projectRef: ref }, { enabled: type !== undefined })
  const ipv4Restrictions = data?.config?.dbAllowedCidrs ?? []
  // @ts-ignore [Joshen] API typing issue
  const ipv6Restrictions = data?.config?.dbAllowedCidrsV6 ?? []
  const restrictedIps = ipv4Restrictions.concat(ipv6Restrictions)

  const maxCidrBlockSize = getMaxCidrBlockSize(type)
  const formSchema = useMemo(() => getFormSchema(type), [type])
  const defaultValues: FormValues = { ipAddress: '', cidrBlockSize: maxCidrBlockSize }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    // Reset the draft fields when the dialog opens for a different type
    values: defaultValues,
  })
  const { errors } = form.formState

  const [cidrBlockSize, ipAddress] = useWatch({
    name: ['cidrBlockSize', 'ipAddress'],
    control: form.control,
  })
  const hasDraft = ipAddress.trim() !== ''
  const pendingCount = stagedAddresses.length + (hasDraft ? 1 : 0)

  const handleClose = () => {
    setStagedAddresses([])
    form.reset()
    onClose()
  }

  const {
    confirmOnClose,
    handleOpenChange,
    modalProps: discardChangesModalProps,
  } = useConfirmOnClose({
    checkIsDirty: () => pendingCount > 0,
    onClose: handleClose,
  })

  const { mutate: applyNetworkRestrictions, isPending: isApplying } =
    useNetworkRestrictionsApplyMutation({
      onSuccess: () => handleClose(),
    })

  // Validates the draft fields and moves a valid entry to the list. Returns the
  // updated list, or undefined if the draft was rejected.
  const addDraftToList = async () => {
    const isValid = await form.trigger()
    if (!isValid) return

    const { ipAddress, cidrBlockSize } = form.getValues()
    const address = `${ipAddress}/${cidrBlockSize}`
    const normalizedAddress = normalize(address)

    if (restrictedIps.includes(address) || restrictedIps.includes(normalizedAddress)) {
      form.setError('ipAddress', { message: `The address ${address} is already restricted` })
      return
    }
    if (stagedAddresses.includes(normalizedAddress)) {
      form.setError('ipAddress', { message: `The address ${address} is already in the list` })
      return
    }

    const nextAddresses = [...stagedAddresses, normalizedAddress]
    setStagedAddresses(nextAddresses)
    form.reset()
    return nextAddresses
  }

  const handleSave = async () => {
    if (!ref) return console.error('Project ref is required')

    // A valid entry that was typed but not yet added to the list is saved too
    const addresses = hasDraft ? await addDraftToList() : stagedAddresses
    if (addresses === undefined || addresses.length === 0) return

    // Based on the submitted addresses, as the staged list may not have updated yet
    const applyOptions = {
      onSuccess: () =>
        toast.success(addresses.length === 1 ? 'Restriction added' : 'Restrictions added'),
    }

    // Need to replace over arching restriction (allow all / disallow all)
    if (hasOverachingRestriction) {
      const dbAllowedCidrs = type === 'IPv4' ? addresses : []
      const dbAllowedCidrsV6 = type === 'IPv6' ? addresses : []
      applyNetworkRestrictions({ projectRef: ref, dbAllowedCidrs, dbAllowedCidrsV6 }, applyOptions)
    } else {
      const dbAllowedCidrs =
        type === 'IPv4' ? [...ipv4Restrictions, ...addresses] : ipv4Restrictions
      const dbAllowedCidrsV6 =
        type === 'IPv6' ? [...ipv6Restrictions, ...addresses] : ipv6Restrictions
      applyNetworkRestrictions({ projectRef: ref, dbAllowedCidrs, dbAllowedCidrsV6 }, applyOptions)
    }
  }

  const availableAddresses = Math.pow(2, maxCidrBlockSize - (cidrBlockSize ?? 0))

  const addressRange =
    type !== undefined ? getAddressEndRange(type, `${ipAddress}/${cidrBlockSize}`) : undefined

  const isValidCIDR =
    errors.cidrBlockSize == null && errors.ipAddress == null && addressRange != null

  const normalizedAddress = isValidCIDR
    ? normalize(`${ipAddress}/${cidrBlockSize}`)
    : `${ipAddress}/${cidrBlockSize}`

  return (
    <>
      <Dialog open={type !== undefined} onOpenChange={handleOpenChange}>
        <DialogContent size="medium">
          <DialogHeader>
            <DialogTitle>{`Add ${type} restrictions`}</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <Form {...form}>
            <DialogSection className="space-y-4">
              <p className="text-sm text-foreground-light">
                This adds IP address ranges to the list of allowed ranges that can access your
                database. Add as many as you need, then save them together.
              </p>
              <InformationBox
                title="Note: Restrictions only apply to direct connections to your database and connection pooler"
                description="They do not currently apply to APIs offered over HTTPS, such as PostgREST, Storage, or Authentication."
                urlLabel="Learn more"
                url={`${DOCS_URL}/guides/platform/network-restrictions#limitations`}
              />
              <form
                noValidate
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  addDraftToList()
                }}
              >
                <div className="flex space-x-4">
                  <div className="w-[55%]">
                    <FormField
                      control={form.control}
                      name="ipAddress"
                      render={({ field }) => (
                        <FormItemLayout layout="vertical" label={`${type} address`}>
                          <FormControl>
                            <Input {...field} placeholder={type === 'IPv4' ? '0.0.0.0' : '::0'} />
                          </FormControl>
                        </FormItemLayout>
                      )}
                    />
                  </div>
                  <div className="grow">
                    <FormField
                      control={form.control}
                      name="cidrBlockSize"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="vertical"
                          label={
                            <div className="flex items-center space-x-2">
                              <p>CIDR Block Size</p>
                              <Tooltip>
                                <TooltipTrigger type="button">
                                  <HelpCircleIcon size="14" strokeWidth={2} />
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="w-80">
                                  Classless inter-domain routing (CIDR) notation is the notation
                                  used to identify networks and hosts in the networks. The block
                                  size tells us how many bits we need to take for the network
                                  prefix, and is a value between 0 to {maxCidrBlockSize}.
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          }
                        >
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min={0}
                              max={maxCidrBlockSize}
                              placeholder={maxCidrBlockSize.toString()}
                            />
                          </FormControl>
                        </FormItemLayout>
                      )}
                    />
                  </div>
                </div>
                <Button
                  variant="default"
                  size="tiny"
                  type="submit"
                  icon={<PlusIcon />}
                  disabled={isApplying || !hasDraft}
                >
                  Add to list
                </Button>
              </form>
            </DialogSection>
            {stagedAddresses.length > 0 && (
              <>
                <DialogSectionSeparator />
                <DialogSection className="space-y-2">
                  <p className="text-sm">
                    {stagedAddresses.length === 1
                      ? '1 range to add'
                      : `${stagedAddresses.length} ranges to add`}
                  </p>
                  <ul className="space-y-2">
                    {stagedAddresses.map((address) => (
                      <li key={address} className="flex items-center space-x-2">
                        <Input
                          readOnly
                          size="small"
                          value={address}
                          aria-label={`Restriction ${address}`}
                          className="flex-1"
                        />
                        <Button
                          size="tiny"
                          icon={<TrashIcon size={12} />}
                          aria-label={`Remove ${address}`}
                          className="h-[34px] w-[34px] shrink-0"
                          disabled={isApplying}
                          onClick={() =>
                            setStagedAddresses((addresses) =>
                              addresses.filter((item) => item !== address)
                            )
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </DialogSection>
              </>
            )}
            <DialogSectionSeparator />
            {isValidCIDR ? (
              <DialogSection className="space-y-1">
                <p className="text-sm">
                  The address range <code>{normalizedAddress}</code> will be restricted
                </p>
                <p className="text-sm text-foreground-light">
                  Selected address space: <code>{addressRange.start}</code> to{' '}
                  <code>{addressRange.end}</code>{' '}
                </p>
                <p className="text-sm text-foreground-light">
                  Number of addresses: {availableAddresses}
                </p>
              </DialogSection>
            ) : (
              <DialogSection>
                <div className="h-[68px] flex items-center">
                  <p className="text-sm text-foreground-light">
                    A summary of your restriction will be shown here after entering a valid IP
                    address and CIDR block size. IP addresses will also be normalized.
                  </p>
                </div>
              </DialogSection>
            )}
            <DialogFooter>
              <Button disabled={isApplying} onClick={confirmOnClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                loading={isApplying}
                disabled={isApplying || pendingCount === 0}
                onClick={handleSave}
              >
                {pendingCount === 1 ? 'Save restriction' : 'Save restrictions'}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
      <DiscardChangesConfirmationDialog
        {...discardChangesModalProps}
        description="Are you sure you want to discard your changes? Your restrictions will not be saved."
      />
    </>
  )
}
