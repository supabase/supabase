import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { UseFormReturn } from 'react-hook-form'

import { useParams } from 'common'
import Panel from 'components/ui/Panel'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import {
  Badge,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { OrgNotFound } from '../Organization/OrgNotFound'
import { NotOrganizationOwnerWarning } from './NotOrganizationOwnerWarning'
import { CreateProjectForm } from './ProjectCreation.schema'

interface OrganizationSelectorProps {
  form: UseFormReturn<CreateProjectForm>
}

export const OrganizationSelector = ({ form }: OrganizationSelectorProps) => {
  const router = useRouter()
  const { slug } = useParams()
  const { data: currentOrg } = useSelectedOrganizationQuery()
  const { can: isAdmin } = useAsyncCheckPermissions(PermissionAction.CREATE, 'projects')

  const { data: organizations, isSuccess: isOrganizationsSuccess } = useOrganizationsQuery()
  const isInvalidSlug = isOrganizationsSuccess && currentOrg === undefined
  const orgNotFound = (organizations?.length ?? 0) > 0 && isInvalidSlug

  return (
    <Panel.Content className="space-y-4">
      {isAdmin && !isInvalidSlug && (
        <FormField_Shadcn_
          control={form.control}
          name="organization"
          render={({ field }) => (
            <FormItemLayout label="Organization" layout="horizontal">
              {(organizations?.length ?? 0) > 0 && (
                <Select_Shadcn_
                  onValueChange={(slug) => {
                    field.onChange(slug)
                    router.push(`/new/${slug}`)
                  }}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl_Shadcn_>
                    <SelectTrigger_Shadcn_>
                      <SelectValue_Shadcn_ placeholder="Select an organization" />
                    </SelectTrigger_Shadcn_>
                  </FormControl_Shadcn_>
                  <SelectContent_Shadcn_>
                    <SelectGroup_Shadcn_>
                      {organizations?.map((x) => (
                        <SelectItem_Shadcn_
                          key={x.id}
                          value={x.slug}
                          className="flex justify-between"
                        >
                          <span className="mr-2">{x.name}</span>
                          <Badge>{x.plan.name}</Badge>
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectGroup_Shadcn_>
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              )}
            </FormItemLayout>
          )}
        />
      )}

      {isOrganizationsSuccess && !isAdmin && !orgNotFound && (
        <NotOrganizationOwnerWarning slug={slug} />
      )}
      {orgNotFound && <OrgNotFound slug={slug} />}
    </Panel.Content>
  )
}
