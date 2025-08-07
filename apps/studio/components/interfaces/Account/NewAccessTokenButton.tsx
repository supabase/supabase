import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useAccessTokenCreateMutation } from 'data/access-tokens/access-tokens-create-mutation'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export interface NewAccessTokenButtonProps {
  onCreateToken: (token: any) => void
}

const TokenSchema = z.object({
  tokenName: z.string().min(1, 'Please enter a name for the token'),
})

const formId = 'new-access-token-form'

const NewAccessTokenButton = ({ onCreateToken }: NewAccessTokenButtonProps) => {
  const [visible, setVisible] = useState(false)
  const [tokenScope, setTokenScope] = useState<'V0' | undefined>(undefined)

  const form = useForm<z.infer<typeof TokenSchema>>({
    resolver: zodResolver(TokenSchema),
    defaultValues: { tokenName: '' },
    mode: 'onSubmit',
  })
  const { mutate: createAccessToken, isLoading } = useAccessTokenCreateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof TokenSchema>> = async (values) => {
    createAccessToken(
      { name: values.tokenName, scope: tokenScope },
      {
        onSuccess: (data) => {
          toast.success(`Your access token "${data.name}" is ready.`)
          form.reset()
          onCreateToken(data)
          setVisible(false)
        },
      }
    )
  }

  return (
    <>
      <div className="flex items-center">
        <Button
          className="rounded-r-none px-3"
          onClick={() => {
            setTokenScope(undefined)
            setVisible(true)
          }}
        >
          Generate new token
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="primary"
              title="Choose token scope"
              className="rounded-l-none px-[4px] py-[5px]"
              icon={<ChevronDown />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom">
            <DropdownMenuItem
              key="experimental-token"
              onClick={() => {
                setTokenScope('V0')
                setVisible(true)
              }}
            >
              <div className="space-y-1">
                <p className="block text-foreground">Generate token for experimental API</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog
        open={visible}
        onOpenChange={(open) => {
          if (!open) form.reset()
          setVisible(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tokenScope === 'V0' ? 'Generate token for experimental API' : 'Generate New Token'}
            </DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection className="flex flex-col gap-4">
            {tokenScope === 'V0' && (
              <Admonition
                type="warning"
                title="The experimental API provides additional endpoints which allows you to manage your organizations and projects."
                description={
                  <>
                    <p>
                      These include deleting organizations and projects which cannot be undone. As
                      such, be very careful when using this API.
                    </p>
                    <div className="mt-4">
                      <Button asChild type="default" icon={<ExternalLink />}>
                        <Link
                          href="https://api.supabase.com/api/v0"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Experimental API documentation
                        </Link>
                      </Button>
                    </div>
                  </>
                }
              />
            )}
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
              </form>
            </Form_Shadcn_>
          </DialogSection>
          <DialogFooter>
            <Button
              type="default"
              disabled={isLoading}
              onClick={() => {
                form.reset()
                setVisible(false)
              }}
            >
              Cancel
            </Button>
            <Button form={formId} htmlType="submit" loading={isLoading}>
              Generate token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default NewAccessTokenButton
