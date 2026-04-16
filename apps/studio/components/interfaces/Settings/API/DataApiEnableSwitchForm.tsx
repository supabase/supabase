import type { UseFormReturn } from 'react-hook-form'
import {
  CardContent,
  CardFooter,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DataApiDisabledAlert } from './DataApiDisabledAlert'
import type { DataApiFormValues } from './DataApiEnableSwitch.types'
import { FormActions } from '@/components/ui/Forms/FormActions'

export const DataApiEnableSwitchForm = ({
  form,
  formId,
  disabled,
  isBusy,
  permissionsHelper,
  onSubmit,
  handleReset,
}: {
  form: UseFormReturn<DataApiFormValues>
  formId: string
  disabled: boolean
  isBusy: boolean
  permissionsHelper: string | undefined
  onSubmit: (values: DataApiFormValues) => void
  handleReset: () => void
}) => {
  const watchedEnabled = form.watch('enableDataApi')

  return (
    <Form_Shadcn_ {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent>
          <FormField_Shadcn_
            control={form.control}
            name="enableDataApi"
            render={({ field }) => (
              <FormItem_Shadcn_ className="space-y-4">
                <FormItemLayout
                  layout="flex-row-reverse"
                  label="Enable Data API"
                  description="When enabled you will be able to use any Supabase client library and PostgREST endpoints with any schema configured in the Settings tab."
                >
                  <FormControl_Shadcn_>
                    <Switch
                      size="large"
                      disabled={disabled}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>

                {!watchedEnabled && <DataApiDisabledAlert />}
              </FormItem_Shadcn_>
            )}
          />
        </CardContent>
        <CardFooter>
          <FormActions
            form={formId}
            isSubmitting={isBusy}
            hasChanges={form.formState.isDirty}
            handleReset={handleReset}
            disabled={disabled}
            helper={permissionsHelper}
          />
        </CardFooter>
      </form>
    </Form_Shadcn_>
  )
}
