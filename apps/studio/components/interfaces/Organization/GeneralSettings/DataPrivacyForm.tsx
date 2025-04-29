import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import type { ResponseError } from 'types'
import { useOrganizationUpdateMutation } from 'data/organizations/organization-update-mutation'
import { invalidateOrganizationsQuery } from 'data/organizations/organizations-query'
import { OPT_IN_TAGS } from 'lib/constants'
import {
  Form_Shadcn_,
  Card,
  CardContent,
  CardFooter,
  FormField_Shadcn_,
  RadioGroupCard,
  RadioGroupCardItem,
} from 'ui'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import OptInToOpenAIToggle from './OptInToOpenAIToggle'

const DataPrivacySchema = z.object({
  aiOptInLevel: z.enum(['disabled', 'schema', 'schema_and_data'], {
    required_error: 'AI Opt-in level selection is required',
  }),
})

const getAiOptInLevel = (tags: string[] | undefined): 'disabled' | 'schema' | 'schema_and_data' => {
  const hasSql = tags?.includes(OPT_IN_TAGS.AI_SQL) ?? false
  const hasData = tags?.includes(OPT_IN_TAGS.AI_DATA ?? 'AI_DATA')

  if (hasSql && hasData) {
    return 'schema_and_data'
  } else if (hasSql) {
    return 'schema'
  } else {
    return 'disabled'
  }
}

const DataPrivacyForm = () => {
  const selectedOrganization = useSelectedOrganization()
  const canUpdateOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')
  const { slug } = useParams()
  const queryClient = useQueryClient()

  const { mutate: updateOrganization, isLoading: isUpdatingPrivacy } =
    useOrganizationUpdateMutation()

  const dataPrivacyForm = useForm<z.infer<typeof DataPrivacySchema>>({
    resolver: zodResolver(DataPrivacySchema),
    defaultValues: {
      aiOptInLevel: getAiOptInLevel(selectedOrganization?.opt_in_tags),
    },
  })

  useEffect(() => {
    if (selectedOrganization && !isUpdatingPrivacy) {
      dataPrivacyForm.reset({
        aiOptInLevel: getAiOptInLevel(selectedOrganization.opt_in_tags),
      })
    }
  }, [selectedOrganization, dataPrivacyForm.reset, isUpdatingPrivacy])

  const onUpdateDataPrivacy = async (values: z.infer<typeof DataPrivacySchema>) => {
    if (!canUpdateOrganization) {
      return toast.error('You do not have the required permissions to update this organization')
    }
    if (!slug) return console.error('Slug is required')

    const existingOptInTags = selectedOrganization?.opt_in_tags ?? []
    let updatedOptInTags = existingOptInTags.filter(
      (tag: string) => tag !== OPT_IN_TAGS.AI_SQL && tag !== (OPT_IN_TAGS.AI_DATA ?? 'AI_DATA')
    )
    if (values.aiOptInLevel === 'schema' || values.aiOptInLevel === 'schema_and_data') {
      updatedOptInTags.push(OPT_IN_TAGS.AI_SQL)
    }
    if (values.aiOptInLevel === 'schema_and_data') {
      updatedOptInTags.push(OPT_IN_TAGS.AI_DATA ?? 'AI_DATA')
    }
    updatedOptInTags = [...new Set(updatedOptInTags)]

    updateOrganization(
      { slug, opt_in_tags: updatedOptInTags },
      {
        onSuccess: () => {
          invalidateOrganizationsQuery(queryClient)
          toast.success('Successfully updated data privacy settings')
        },
        onError: (error: ResponseError) => {
          toast.error(`Failed to update data privacy settings: ${error.message}`)
        },
      }
    )
  }

  const permissionsHelperText = !canUpdateOrganization
    ? "You need additional permissions to manage this organization's settings"
    : undefined

  return (
    <Form_Shadcn_ {...dataPrivacyForm}>
      <form id="org-privacy-form" onSubmit={dataPrivacyForm.handleSubmit(onUpdateDataPrivacy)}>
        <Card>
          <CardContent className="pt-6">
            <FormField_Shadcn_
              control={dataPrivacyForm.control}
              name="aiOptInLevel"
              render={({ field }) => (
                <FormItemLayout
                  label="Supabase AI Opt-in Level"
                  layout="flex-row-reverse"
                  description={
                    <>
                      <p className="mb-4">
                        By opting into sending anonymous data, Supabase AI can improve the answers
                        it shows you. This is an organization-wide setting. Select the level of data
                        you are comfortable sharing.
                      </p>
                      <OptInToOpenAIToggle />
                    </>
                  }
                >
                  <RadioGroupCard
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!canUpdateOrganization || isUpdatingPrivacy}
                    className="grid gap-4 sm:grid-cols-3"
                  >
                    <RadioGroupCardItem
                      key="disabled"
                      value="disabled"
                      label={
                        <span className="flex flex-col gap-2">
                          <span className="text-foreground">Disabled</span>
                          <span className="text-foreground-light text-xs">
                            No data is sent to OpenAI, responses will be generic.
                          </span>
                        </span>
                      }
                    />
                    <RadioGroupCardItem
                      key="schema"
                      value="schema"
                      label={
                        <span className="flex flex-col gap-2">
                          <span className="text-foreground">Schema Only</span>
                          <span className="text-foreground-light text-xs">
                            Send only your database schema to OpenAI for better responses.
                          </span>
                        </span>
                      }
                    />
                    <RadioGroupCardItem
                      key="schema_and_data"
                      value="schema_and_data"
                      label={
                        <span className="flex flex-col gap-2">
                          <span className="text-foreground">Schema & Sample Data</span>
                          <span className="text-foreground-light text-xs">
                            Send schema and SQL query data for the best AI responses.
                          </span>
                        </span>
                      }
                    />
                  </RadioGroupCard>
                </FormItemLayout>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end p-4 md:px-8">
            <FormActions
              form="org-privacy-form"
              isSubmitting={isUpdatingPrivacy}
              hasChanges={dataPrivacyForm.formState.isDirty}
              handleReset={() => dataPrivacyForm.reset()}
              helper={permissionsHelperText}
              disabled={!canUpdateOrganization}
            />
          </CardFooter>
        </Card>
      </form>
    </Form_Shadcn_>
  )
}

export default DataPrivacyForm
