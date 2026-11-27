import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, Input } from 'ui'
import { CollapsibleCardSection } from 'ui-patterns/CollapsibleCardSection'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import {
  onboardingSurveySchema,
  ORG_KIND_DEFAULT,
  ORG_SIZE_DEFAULT,
} from '../../OnboardingSurvey/OnboardingSurvey.constants'
import { OnboardingSurveyFields } from '../../OnboardingSurvey/OnboardingSurveyFields'

interface Props {
  onSubmit: (values: NewMarketplaceOrgForm) => void
}

export const CREATE_AWS_MANAGED_ORG_FORM_ID = 'create-aws-managed-org-form'

const formSchema = onboardingSurveySchema.extend({
  name: z.string().trim().min(1, 'Organization name is required'),
})

export type NewMarketplaceOrgForm = z.infer<typeof formSchema>

const defaultValues: NewMarketplaceOrgForm = {
  name: '',
  kind: ORG_KIND_DEFAULT,
  size: ORG_SIZE_DEFAULT,
  building: '',
  can_code: '',
}

export const NewAwsMarketplaceOrgForm = ({ onSubmit }: Props) => {
  const form = useForm<NewMarketplaceOrgForm>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  return (
    <Form {...form}>
      <form id={CREATE_AWS_MANAGED_ORG_FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItemLayout
                label="Name"
                layout="horizontal"
                description="What's the name of your company or team? You can change this later."
              >
                <FormControl>
                  <Input
                    autoFocus
                    type="text"
                    placeholder="Organization name"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    data-bwignore
                    {...field}
                  />
                </FormControl>
              </FormItemLayout>
            )}
          />
          <CollapsibleCardSection
            title="Help improve Supabase"
            description="Optional questions to help improve the Supabase experience"
            defaultOpen
          >
            <OnboardingSurveyFields control={form.control} />
          </CollapsibleCardSection>
        </div>
      </form>
    </Form>
  )
}
