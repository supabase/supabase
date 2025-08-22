import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useAccessTokenCreateMutation } from 'data/scoped-access-tokens/scoped-access-token-create-mutation'
import {
  Button,
  Form_Shadcn_,
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { BasicInfo } from './Form/BasicInfo'
import { Permissions } from './Form/Permissions'
import { ResourceAccess } from './Form/ResourceAccess'
import { mapPermissionToFGA, ExpiresAtOptions } from '../AccessToken.constants'

const PermissionRowSchema = z.object({
  resource: z.string().min(1, 'Please select a resource'),
  action: z.string().min(1, 'Please select an action'),
})

const TokenSchema = z.object({
  tokenName: z.string().min(1, 'Please enter a name for the token'),
  expiresAt: z.preprocess((val) => (val === 'never' ? undefined : val), z.string().optional()),
  resourceAccess: z.enum(['all-orgs', 'selected-orgs', 'selected-projects']),
  selectedOrganizations: z.array(z.string()).optional(),
  selectedProjects: z.array(z.string()).optional(),
  organizationPermissions: z.record(z.string(), z.string()).optional(),
  projectPermissions: z.record(z.string(), z.string()).optional(),
  permissionRows: z.array(PermissionRowSchema).optional(),
})

export interface NewScopedTokenSheetProps {
  visible: boolean
  onOpenChange: (open: boolean) => void
  tokenScope: 'V0' | undefined
  onCreateToken: (token: any) => void
}

export const NewScopedTokenSheet = ({
  visible,
  onOpenChange,
  tokenScope,
  onCreateToken,
}: NewScopedTokenSheetProps) => {
  const [resourceSearchOpen, setResourceSearchOpen] = useState(false)
  const [customExpiryDate, setCustomExpiryDate] = useState<{ date: string } | undefined>(undefined)
  const [isCustomExpiry, setIsCustomExpiry] = useState(false)

  const form = useForm<z.infer<typeof TokenSchema>>({
    resolver: zodResolver(TokenSchema),
    defaultValues: {
      tokenName: '',
      expiresAt: ExpiresAtOptions['month'].value,
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
  const expiresAt = form.watch('expiresAt')
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

    // Use custom date if custom option is selected
    let finalExpiresAt = values.expiresAt

    if (isCustomExpiry && customExpiryDate) {
      // Use the date from the custom date picker
      finalExpiresAt = customExpiryDate.date
    }

    // Convert permission rows to the expected permissions format using FGA_PERMISSIONS mapping
    const permissions = permissionRows
      .flatMap((row) => {
        const { resource, action } = row
        return mapPermissionToFGA(resource, action)
      })
      .filter(Boolean) as any

    // Determine organization_slugs and project_refs based on resource access
    let organization_slugs: string[] | undefined
    let project_refs: string[] | undefined

    if (values.resourceAccess === 'selected-orgs') {
      organization_slugs = values.selectedOrganizations || []
    } else if (values.resourceAccess === 'selected-projects') {
      project_refs = values.selectedProjects || []
    }

    createAccessToken(
      {
        name: values.tokenName,
        expires_at: finalExpiresAt,
        permissions,
        organization_slugs,
        project_refs,
      },
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
    form.reset({
      tokenName: '',
      expiresAt: ExpiresAtOptions['month'].value,
      resourceAccess: 'all-orgs',
      selectedOrganizations: [],
      selectedProjects: [],
      organizationPermissions: {},
      projectPermissions: {},
      permissionRows: [],
    })
    setCustomExpiryDate(undefined)
    setIsCustomExpiry(false)
    onOpenChange(false)
  }

  const handleCustomDateChange = (date: { date: string } | undefined) => {
    setCustomExpiryDate(date)
  }

  const handleCustomExpiryChange = (isCustom: boolean) => {
    setIsCustomExpiry(isCustom)
    if (isCustom && !customExpiryDate) {
      // Set a default custom date (today at 23:59:59)
      const defaultCustomDate = {
        date: dayjs().endOf('day').toISOString(),
      }
      setCustomExpiryDate(defaultCustomDate)
    }
  }

  return (
    <Sheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) handleClose()
        onOpenChange(open)
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
              <div className="px-4 sm:px-5 py-4 pb-4">
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
              </div>
            )}

            <Form_Shadcn_ {...form}>
              <div className="flex flex-col gap-0 overflow-visible">
                <BasicInfo
                  control={form.control}
                  expirationDate={expiresAt || ''}
                  onCustomDateChange={handleCustomDateChange}
                  onCustomExpiryChange={handleCustomExpiryChange}
                />
                <Separator />
                <ResourceAccess control={form.control} resourceAccess={resourceAccess} />
                <Separator />
                <Permissions
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
        <SheetFooter className="!justify-end w-full mt-auto py-4 border-t">
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
  )
}
