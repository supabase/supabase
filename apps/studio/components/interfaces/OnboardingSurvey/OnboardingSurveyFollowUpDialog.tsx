import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import {
  BUILDING_MAX_LENGTH,
  BUILDING_PLACEHOLDER,
  ORG_SIZE_DEFAULT,
  ORG_SIZE_TYPES,
  SURVEY_ORG_KIND_TYPES,
} from './OnboardingSurvey.constants'

const FORM_ID = 'onboarding-survey-follow-up-form'

const FormSchema = z.object({
  kind: z.string(),
  size: z.string(),
  building: z.string().max(BUILDING_MAX_LENGTH),
})

export type OnboardingSurveyFollowUpValues = z.infer<typeof FormSchema>

const defaultValues: OnboardingSurveyFollowUpValues = {
  kind: '',
  size: ORG_SIZE_DEFAULT,
  building: '',
}

type OnboardingSurveyFollowUpDialogProps = {
  open: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSkip: () => void
  onSubmit: (values: OnboardingSurveyFollowUpValues) => void
}

export function OnboardingSurveyFollowUpDialog({
  open,
  isSubmitting,
  onOpenChange,
  onSkip,
  onSubmit,
}: OnboardingSurveyFollowUpDialogProps) {
  const form = useForm<OnboardingSurveyFollowUpValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const [kind, building] = useWatch({ control: form.control, name: ['kind', 'building'] })
  const hasAnswer = kind !== '' || building.trim() !== ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="small" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Tell us about your organization</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form {...form}>
          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="flex flex-col gap-y-5 pt-4.5 pb-5">
              <p className="text-sm text-foreground-light">
                Both questions are optional. Your answers help us improve Supabase.
              </p>

              <FormField
                control={form.control}
                name="kind"
                render={({ field }) => (
                  <FormItemLayout label="Who is this org for?" layout="vertical">
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SURVEY_ORG_KIND_TYPES).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItemLayout>
                )}
              />

              {kind === 'COMPANY' && (
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItemLayout label="How many people?" layout="vertical">
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ORG_SIZE_TYPES).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="building"
                render={({ field }) => (
                  <FormItemLayout label="What are you building?" layout="vertical">
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          {...field}
                          rows={3}
                          maxLength={BUILDING_MAX_LENGTH}
                          placeholder={BUILDING_PLACEHOLDER}
                          className="resize-none pb-6"
                        />
                        <span className="pointer-events-none absolute bottom-1.5 right-2 text-xs text-foreground-lighter">
                          {field.value.length}/{BUILDING_MAX_LENGTH}
                        </span>
                      </div>
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </DialogSection>
          </form>
        </Form>

        <DialogFooter className="px-5 py-4">
          <Button variant="default" disabled={isSubmitting} onClick={onSkip}>
            Skip
          </Button>
          <Button form={FORM_ID} type="submit" loading={isSubmitting} disabled={!hasAnswer}>
            Send answers
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
