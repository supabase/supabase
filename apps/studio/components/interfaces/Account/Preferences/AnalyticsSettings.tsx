import { zodResolver } from '@hookform/resolvers/zod'
import { useConsentState } from 'common'
import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { InlineLink } from 'components/ui/InlineLink'
import { useSendResetMutation } from 'data/telemetry/send-reset-mutation'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Card, CardContent, Form_Shadcn_, FormControl_Shadcn_, FormField_Shadcn_, Switch } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import * as z from 'zod'

export const PrivacyUpdateBanner = () => {
  const [privacyUpdateAcknowledged, setPrivacyUpdateAcknowledged] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.PRIVACY_NOTICE_ACKNOWLEDGED,
    false
  )

  if (privacyUpdateAcknowledged) return null

  return (
    <Admonition
      type="note"
      title="Updates to our privacy policy"
      description={
        <>
          We’ve clarified how we use analytics, cookies, and advertising tools in our{' '}
          <InlineLink href="https://supabase.com/privacy">privacy policy</InlineLink>, effective
          March 16, 2026. By continuing to use Supabase, you agree to the updated terms.{' '}
          <InlineLink href="mailto:privacy@supabase.com">Contact us</InlineLink> with any
          questions.{' '}
        </>
      }
      className="mb-10 relative"
    >
      <ButtonTooltip
        type="text"
        icon={<X />}
        className="absolute top-2 right-2 px-1"
        onClick={() => setPrivacyUpdateAcknowledged(true)}
        tooltip={{ content: { side: 'bottom', text: 'Dismiss' } }}
      />
    </Admonition>
  )
}

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
