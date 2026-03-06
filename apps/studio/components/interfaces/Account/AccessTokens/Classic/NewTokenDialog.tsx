import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { DatePicker } from 'components/ui/DatePicker'
import {
  useAccessTokenCreateMutation,
  type NewAccessToken,
} from 'data/access-tokens/access-tokens-create-mutation'
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
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  WarningIcon,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  CUSTOM_EXPIRY_VALUE,
  EXPIRES_AT_OPTIONS,
  NON_EXPIRING_TOKEN_VALUE,
} from '../AccessToken.constants'
import { getExpirationDate } from '../AccessToken.utils'

const formId = 'new-access-token-form'

const TokenSchema = z.object({
  tokenName: z.string().min(1, 'Please enter a name for the token'),
  expiresAt: z.preprocess(
    (val) => (val === NON_EXPIRING_TOKEN_VALUE ? undefined : val),
    z.string().optional()
  ),
})

export interface NewAccessTokenDialogProps {
  open: boolean
  tokenScope: 'V0' | undefined
  onOpenChange: (open: boolean) => void
  onCreateToken: (token: NewAccessToken) => void
}

export const NewTokenDialog = ({
  open,
  tokenScope,
  onOpenChange,
  onCreateToken,
}: NewAccessTokenDialogProps) => {
  const [customExpiryDate, setCustomExpiryDate] = useState<{ date: string } | undefined>(undefined)
  const [isCustomExpiry, setIsCustomExpiry] = useState(false)

  const form = useForm<z.infer<typeof TokenSchema>>({
    resolver: zodResolver(TokenSchema),
    defaultValues: { tokenName: '', expiresAt: EXPIRES_AT_OPTIONS['month'].value },
    mode: 'onChange',
  })
  const { mutate: createAccessToken, isPending } = useAccessTokenCreateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof TokenSchema>> = async (values) => {
    let expiresAt: string | undefined

    if (isCustomExpiry && customExpiryDate) {
      expiresAt = customExpiryDate.date
    } else {
      expiresAt = getExpirationDate(values.expiresAt || '')
    }

    createAccessToken(
      { name: values.tokenName, scope: tokenScope, expires_at: expiresAt },
      {
        onSuccess: (data) => {
          toast.success('Access token created successfully')
          onCreateToken(data)
          handleClose()
        },
      }
    )
  }

  const handleClose = () => {
    form.reset({ tokenName: '' })
    setCustomExpiryDate(undefined)
    setIsCustomExpiry(false)
    onOpenChange(false)
  }

  const handleExpiryChange = (value: string) => {
    if (value === CUSTOM_EXPIRY_VALUE) {
      setIsCustomExpiry(true)
      // Set a default custom date (today at 23:59:59)
      const defaultCustomDate = {
        date: dayjs().endOf('day').toISOString(),
      }
      setCustomExpiryDate(defaultCustomDate)
      form.setValue('expiresAt', value)
    } else {
      setIsCustomExpiry(false)
      setCustomExpiryDate(undefined)
      form.setValue('expiresAt', value)
    }
  }

  const handleCustomDateChange = (value: { date: string }) => {
    setCustomExpiryDate(value)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          form.reset()
          setCustomExpiryDate(undefined)
          setIsCustomExpiry(false)
        }
        onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tokenScope === 'V0' ? 'Generate token for experimental API' : 'Generate New Token'}
          </DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        {tokenScope === 'V0' ? (
          <Admonition
            type="warning"
            className="rounded-none border-t-0 border-x-0"
            title="The experimental API provides additional endpoints which allows you to manage your organizations and projects."
            description={
              <>
                <p>
                  These include deleting organizations and projects which cannot be undone. As such,
                  be very careful when using this API.
                </p>
                <div className="mt-4">
                  <Button asChild type="default" icon={<ExternalLink />}>
                    <a href="https://api.supabase.com/api/v0" target="_blank" rel="noreferrer">
                      Experimental API documentation
                    </a>
                  </Button>
                </div>
              </>
            }
          />
        ) : (
          <Admonition
            type="warning"
            className="rounded-none border-t-0 border-x-0"
            title="Access tokens can be used to control your whole account"
            description="Be careful when sharing your tokens"
          />
        )}
        <DialogSection className="flex flex-col gap-4">
          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField_Shadcn_
                key="tokenName"
                name="tokenName"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout name="tokenName" label="Name">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        id="tokenName"
                        {...field}
                        placeholder="Provide a name for your token"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                key="expiresAt"
                name="expiresAt"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout name="expiresAt" label="Expires in">
                    <div className="flex gap-2">
                      <FormControl_Shadcn_ className="flex-grow">
                        <Select_Shadcn_ value={field.value} onValueChange={handleExpiryChange}>
                          <SelectTrigger_Shadcn_>
                            <SelectValue_Shadcn_ placeholder="Expires at" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {Object.values(EXPIRES_AT_OPTIONS).map(
                              (option: { value: string; label: string }) => (
                                <SelectItem_Shadcn_ key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem_Shadcn_>
                              )
                            )}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormControl_Shadcn_>
                      {isCustomExpiry && (
                        <DatePicker
                          selectsRange={false}
                          triggerButtonSize="small"
                          contentSide="top"
                          to={customExpiryDate?.date}
                          minDate={new Date()}
                          maxDate={dayjs().add(1, 'year').toDate()}
                          onChange={(date) => {
                            if (date.to) handleCustomDateChange({ date: date.to })
                          }}
                        />
                      )}
                    </div>
                    {field.value === NON_EXPIRING_TOKEN_VALUE && (
                      <div className="w-full flex gap-x-2 items-center mt-3 mx-0.5">
                        <WarningIcon />
                        <span className="text-xs text-left text-foreground-lighter">
                          Make sure to keep your non-expiring token safe and secure.
                        </span>
                      </div>
                    )}
                  </FormItemLayout>
                )}
              />
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogFooter>
          <Button
            type="default"
            disabled={isPending}
            onClick={() => {
              form.reset()
              setCustomExpiryDate(undefined)
              setIsCustomExpiry(false)
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          <Button form={formId} htmlType="submit" loading={isPending}>
            Generate token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
