import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'

import {
  ORG_KIND_DEFAULT,
  ORG_SIZE_DEFAULT,
  OrganizationDetailsFields,
  organizationDetailsSchema,
  type OrganizationDetailsFormValues,
} from '../NewOrg/OrganizationDetailsFields'

interface Props {
  onSubmit: (values: NewMarketplaceOrgForm) => void
}

export const CREATE_AWS_MANAGED_ORG_FORM_ID = 'create-aws-managed-org-form'

export type NewMarketplaceOrgForm = OrganizationDetailsFormValues

export const NewAwsMarketplaceOrgForm = ({ onSubmit }: Props) => {
  const form = useForm<NewMarketplaceOrgForm>({
    resolver: zodResolver(organizationDetailsSchema),
    defaultValues: {
      name: '',
      kind: ORG_KIND_DEFAULT,
      size: ORG_SIZE_DEFAULT,
    },
  })

  const kind = form.watch('kind')

  return (
    <Form {...form}>
      <form id={CREATE_AWS_MANAGED_ORG_FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-6">
          <OrganizationDetailsFields control={form.control} kind={kind} />
        </div>
      </form>
    </Form>
  )
}
