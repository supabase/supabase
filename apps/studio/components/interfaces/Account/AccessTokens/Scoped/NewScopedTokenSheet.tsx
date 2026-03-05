import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import {
  useAccessTokenCreateMutation,
  type NewScopedAccessToken,
  type ScopedAccessTokenCreateVariables,
} from 'data/scoped-access-tokens/scoped-access-token-create-mutation'
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
  SheetDescription,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { BasicInfo } from './Form/BasicInfo'
import { Permissions } from './Form/Permissions/Permissions'
import { ResourceAccess } from './Form/ResourceAccess/ResourceAccess'
import {
  CUSTOM_EXPIRY_VALUE,
  EXPIRES_AT_OPTIONS,
  type ScopedAccessTokenPermission,
} from '../AccessToken.constants'
import { useOrgAndProjectData } from '../hooks/useOrgAndProjectData'
import { mapPermissionToFGA, getExpirationDate } from '../AccessToken.utils'
import { TokenSchema, type TokenFormValues } from '../AccessToken.schemas'

export interface NewScopedTokenSheetProps {
  visible: boolean
  onOpenChange: (open: boolean) => void
  tokenScope: 'V0' | undefined
  onCreateToken: (token: NewScopedAccessToken) => void
}

export const NewScopedTokenSheet = ({
  visible,
  onOpenChange,
  tokenScope,
  onCreateToken,
}: NewScopedTokenSheetProps) => {
  const [resourceSearchOpen, setResourceSearchOpen] = useState(false)
  const { organizations, projects } = useOrgAndProjectData()

  const form = useForm<TokenFormValues>({
    resolver: zodResolver(TokenSchema),
    defaultValues: {
      tokenName: '',
      expiresAt: EXPIRES_AT_OPTIONS['month'].value,
      customExpiryDate: undefined,
      resourceAccess: 'all-orgs',
      selectedOrganizations: [],
      selectedProjects: [],
      permissionRows: [],
    },
    mode: 'onChange',
  })
  const { mutate: createAccessToken, isPending } = useAccessTokenCreateMutation()

  const resourceAccess = form.watch('resourceAccess')
  const expiresAt = form.watch('expiresAt')
  const permissionRows = form.watch('permissionRows') || []

  const onSubmit: SubmitHandler<TokenFormValues> = async (values) => {
    if (!permissionRows || permissionRows.length === 0) {
      toast.error('Please configure at least one permission.')
      return
    }

    const hasValidPermissions = permissionRows.every(
      (row) => row.resource && row.actions && row.actions.length > 0
    )
    if (!hasValidPermissions) {
      toast.error('Please ensure all permissions have both resource and action selected.')
      return
    }

    if (values.resourceAccess === 'selected-orgs') {
      const selectedOrgs = values.selectedOrganizations || []

      if (selectedOrgs.length === 0) {
        toast.error('Please select at least one organization.')
        return
      }

      const availableOrgSlugs = organizations.map((org) => org.slug)
      const invalidOrgs = selectedOrgs.filter((slug) => !availableOrgSlugs.includes(slug))

      if (invalidOrgs.length > 0) {
        toast.error(
          `You don't have access to the following organization(s): ${invalidOrgs.join(', ')}`
        )
        return
      }
    }

    if (values.resourceAccess === 'selected-projects') {
      const selectedProjects = values.selectedProjects || []

      if (selectedProjects.length === 0) {
        toast.error('Please select at least one project.')
        return
      }

      const availableProjectRefs = projects.map((project) => project.ref)
      const invalidProjects = selectedProjects.filter((ref) => !availableProjectRefs.includes(ref))

      if (invalidProjects.length > 0) {
        toast.error(
          `You don't have access to the following project(s): ${invalidProjects.join(', ')}`
        )
        return
      }
    }

    const finalExpiresAt =
      values.expiresAt === CUSTOM_EXPIRY_VALUE
        ? values.customExpiryDate
        : getExpirationDate(values.expiresAt || '')

    const permissions = permissionRows
      .flatMap((row) => {
        const { resource, actions } = row
        return actions.flatMap((action) => mapPermissionToFGA(resource, action))
      })
      .filter(Boolean) as ScopedAccessTokenPermission[]

    if (!permissions || permissions.length === 0) {
      toast.error('Please configure at least one valid permission.')
      return
    }

    const finalPayload: ScopedAccessTokenCreateVariables = {
      name: values.tokenName,
      permissions,
    }

    if (finalExpiresAt) {
      finalPayload.expires_at = finalExpiresAt
    }

    if (
      values.resourceAccess === 'selected-orgs' &&
      values.selectedOrganizations &&
      values.selectedOrganizations.length > 0
    ) {
      finalPayload.organization_slugs = values.selectedOrganizations
    } else if (
      values.resourceAccess === 'selected-projects' &&
      values.selectedProjects &&
      values.selectedProjects.length > 0
    ) {
      finalPayload.project_refs = values.selectedProjects
    }

    if (!finalPayload.name || finalPayload.name.trim() === '') {
      toast.error('Please enter a token name.')
      return
    }

    if (!finalPayload.permissions || finalPayload.permissions.length === 0) {
      toast.error('Please configure at least one permission.')
      return
    }

    createAccessToken(finalPayload, {
      onSuccess: (data) => {
        toast.success('Access token created successfully')
        onCreateToken(data)
        handleClose()
      },
      onError: (error) => {
        if (error.message && error.message.includes("don't have access")) {
          toast.error(
            `Access Error: ${error.message}. Please verify you have access to the selected resources.`
          )
        } else {
          toast.error(`Failed to create access token: ${error.message}`)
        }
      },
    })
  }

  const handleClose = () => {
    form.reset({
      tokenName: '',
      expiresAt: EXPIRES_AT_OPTIONS['month'].value,
      customExpiryDate: undefined,
      resourceAccess: 'all-orgs',
      selectedOrganizations: [],
      selectedProjects: [],
      permissionRows: [],
    })
    onOpenChange(false)
  }

  const handleCustomDateChange = useCallback(
    (date: { date: string } | undefined) => {
      form.setValue('customExpiryDate', date?.date, { shouldValidate: true })
    },
    [form]
  )

  const handleCustomExpiryChange = useCallback(
    (isCustom: boolean) => {
      if (isCustom && !form.getValues('customExpiryDate')) {
        form.setValue('customExpiryDate', dayjs().endOf('day').toISOString(), {
          shouldValidate: true,
        })
      }
      if (!isCustom) {
        form.setValue('customExpiryDate', undefined, { shouldValidate: true })
      }
    },
    [form]
  )

  return (
    <Sheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        } else {
          onOpenChange(open)
        }
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
          <SheetDescription className="sr-only">
            A form to generate a new scoped access token.
          </SheetDescription>
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
                <ResourceAccess
                  control={form.control}
                  resourceAccess={resourceAccess}
                  setValue={form.setValue}
                />
                <Separator />
                <Permissions
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
            <Button type="default" disabled={isPending} onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} loading={isPending}>
              Generate token
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
