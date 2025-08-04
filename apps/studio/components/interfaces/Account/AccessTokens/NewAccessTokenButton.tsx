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
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Form_Shadcn_,
  ScrollArea,
  Separator,
} from 'ui'
import { Admonition } from 'ui-patterns'

import { TokenBasicInfoForm } from './TokenBasicInfoForm'
import { TokenResourceAccessForm } from './TokenResourceAccessForm'
import { TokenPermissionsForm } from './TokenPermissionsForm'

export interface NewAccessTokenButtonProps {
  onCreateToken: (token: any) => void
}

const PermissionRowSchema = z.object({
  resource: z.string().min(1, 'Please select a resource'),
  action: z.string().min(1, 'Please select an action'),
})

const TokenSchema = z.object({
  tokenName: z.string().min(1, 'Please enter a name for the token'),
  expirationDate: z.enum(['No expiry', '7 days', '30 days', '90 days', '180 days', 'Custom']),
  resourceAccess: z.enum(['all-orgs', 'selected-orgs', 'selected-projects']),
  selectedOrganizations: z.array(z.string()).optional(),
  selectedProjects: z.array(z.string()).optional(),
  organizationPermissions: z.record(z.string(), z.string()).optional(),
  projectPermissions: z.record(z.string(), z.string()).optional(),
  permissionRows: z.array(PermissionRowSchema).optional(),
})

const NewAccessTokenButton = ({ onCreateToken }: NewAccessTokenButtonProps) => {
  const [visible, setVisible] = useState(false)
  const [tokenScope, setTokenScope] = useState<'V0' | undefined>(undefined)
  const [resourceSearchOpen, setResourceSearchOpen] = useState(false)

  const form = useForm<z.infer<typeof TokenSchema>>({
    resolver: zodResolver(TokenSchema),
    defaultValues: {
      tokenName: '',
      expirationDate: 'No expiry',
      resourceAccess: 'all-orgs',
      selectedOrganizations: [],
      selectedProjects: [],
      organizationPermissions: {},
      projectPermissions: {},
      permissionRows: [],
    },
    mode: 'onChange',
  })
  const { mutate: createAccessToken, isLoading } = useAccessTokenCreateMutation()

  const resourceAccess = form.watch('resourceAccess')
  const expirationDate = form.watch('expirationDate')
  const permissionRows = form.watch('permissionRows') || []

  const onSubmit: SubmitHandler<z.infer<typeof TokenSchema>> = async (values) => {
    // Validate that at least one permission is configured
    if (!permissionRows || permissionRows.length === 0) {
      toast.error('Please configure at least one permission.')
      return
    }

    // Validate that all permission rows have both resource and action
    const hasValidPermissions = permissionRows.every((row) => row.resource && row.action)
    if (!hasValidPermissions) {
      toast.error('Please ensure all permissions have both resource and action selected.')
      return
    }

    createAccessToken(
      { name: values.tokenName, scope: tokenScope },
      {
        onSuccess: (data) => {
          console.log('Generated token data:', data)
          onCreateToken(data)
          handleClose()
        },
      }
    )
  }

  const handleClose = () => {
    form.reset({
      tokenName: '',
      expirationDate: 'No expiry',
      resourceAccess: 'all-orgs',
      selectedOrganizations: [],
      selectedProjects: [],
      organizationPermissions: {},
      projectPermissions: {},
      permissionRows: [],
    })
    setVisible(false)
  }

  const handleDismiss = () => {
    handleClose()
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

      <Sheet
        open={visible}
        onOpenChange={(open) => {
          if (!open) handleClose()
          setVisible(open)
        }}
      >
        <SheetContent
          showClose={false}
          size="default"
          className="!min-w-[600px] flex flex-col h-full gap-0"
        >
          <SheetHeader>
            <SheetTitle>
              {tokenScope === 'V0' ? 'Generate token for experimental API' : 'Generate New Token'}
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 max-h-[calc(100vh-116px)]">
            <div className="flex flex-col overflow-visible">
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
                <div className="flex flex-col gap-0 overflow-visible">
                  {/* Basic Information Section */}
                  <TokenBasicInfoForm control={form.control} expirationDate={expirationDate} />

                  <Separator />

                  {/* Resource Access Section */}
                  <TokenResourceAccessForm control={form.control} resourceAccess={resourceAccess} />

                  <Separator />

                  {/* Permissions Section */}
                  <TokenPermissionsForm
                    control={form.control}
                    setValue={form.setValue}
                    watch={form.watch}
                    resourceSearchOpen={resourceSearchOpen}
                    setResourceSearchOpen={setResourceSearchOpen}
                  />
                </div>
              </Form_Shadcn_>
            </div>
          </ScrollArea>
          <SheetFooter className="!justify-end w-full mt-auto pt-4 border-t">
            <div className="flex gap-2">
              <Button type="default" disabled={isLoading} onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} loading={isLoading}>
                Generate token
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default NewAccessTokenButton
