import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useConsentState } from 'common'
import { useSendResetMutation } from 'data/telemetry/send-reset-mutation'
import { Card, CardContent, FormControl_Shadcn_, FormField_Shadcn_, Form_Shadcn_, Switch } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

const AnalyticsSchema = z.object({
  telemetryEnabled: z.boolean(),
})

export const AnalyticsSettings = () => {
  const { hasAccepted, acceptAll, denyAll, categories } = useConsentState()
  const hasLoaded = categories !== null

  const { mutate: sendReset } = useSendResetMutation()

  const form = useForm<z.infer<typeof AnalyticsSchema>>({
    resolver: zodResolver(AnalyticsSchema),
    values: { telemetryEnabled: hasAccepted },
  })

  const handleToggle = (value: boolean) => {
    if (!hasLoaded) {
      toast.error(
        "We couldn't load the privacy settings due to an ad blocker or network error. Please disable any ad blockers and try again. If the problem persists, please contact support."
      )
      form.setValue('telemetryEnabled', !value)
      return
    }

    if (value) {
      acceptAll()
    } else {
      denyAll()
      sendReset()
    }

    form.setValue('telemetryEnabled', value)
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Analytics and Marketing</PageSectionTitle>
          <PageSectionDescription>
            Control whether telemetry and marketing data is sent from Supabase services.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Form_Shadcn_ {...form}>
          <Card>
            <CardContent>
              <FormField_Shadcn_
                control={form.control}
                name="telemetryEnabled"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Send telemetry data from Supabase services"
                    description="By opting in to sharing telemetry data, Supabase can analyze usage patterns to enhance user experience and use it for marketing and advertising purposes"
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          handleToggle(value)
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </CardContent>
          </Card>
        </Form_Shadcn_>
      </PageSectionContent>
    </PageSection>
  )
}
