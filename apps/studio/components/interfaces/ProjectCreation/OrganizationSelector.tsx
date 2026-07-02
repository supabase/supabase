import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import {
  Badge,
  FormControl,
  FormField,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { OrgNotFound } from '../Organization/OrgNotFound'
import { CreateProjectForm } from './ProjectCreation.schema'
import { NoPermission } from '@/components/ui/NoPermission'
import Panel from '@/components/ui/Panel'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { permissionKeys } from '@/data/permissions/keys'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

interface OrganizationSelectorProps {
  form: UseFormReturn<CreateProjectForm>
}

export const OrganizationSelector = ({ form }: OrganizationSelectorProps) => {
  const router = useRouter()
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const { data: currentOrg } = useSelectedOrganizationQuery()
  const { can: isAdmin } = useAsyncCheckPermissions(PermissionAction.CREATE, 'projects')

  // Permissions may be stale for newly created accounts due to replication lag between
  // org setup and the permissions endpoint. Invalidate in the background on mount so the
  // check reflects the latest state before the user tries to create a project.
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: permissionKeys.list() })
  }, [queryClient])

  const { data: organizations, isSuccess: isOrganizationsSuccess } = useOrganizationsQuery()
  const isInvalidSlug = isOrganizationsSuccess && currentOrg === undefined
  const orgNotFound = (organizations?.length ?? 0) > 0 && isInvalidSlug

  return (
    <Panel.Content className="space-y-4">
      <FormField
        control={form.control}
        name="organization"
        render={({ field }) => (
          <FormItemLayout label="Organization" layout="horizontal">
            {(organizations?.length ?? 0) > 0 && (
              <Select
                onValueChange={(slug) => {
                  field.onChange(slug)
                  router.push(`/new/${slug}`)
                }}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an organization" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    {organizations?.map((x) => (
                      <SelectItem key={x.id} value={x.slug}>
                        <div className="flex justify-between items-center gap-2 w-full">
                          <span>{x.name}</span>
                          <Badge className="mt-px">{x.plan.name}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </FormItemLayout>
        )}
      />

      {isOrganizationsSuccess && !isAdmin && !orgNotFound && (
        <NoPermission resourceText="create a project" />
      )}
      {orgNotFound && <OrgNotFound slug={slug} />}
    </Panel.Content>
  )
}
