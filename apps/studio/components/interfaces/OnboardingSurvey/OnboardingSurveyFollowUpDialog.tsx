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
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { BUILDING_OPTIONS, CODING_EXPERIENCE_OPTIONS } from './OnboardingSurvey.constants'

const FORM_ID = 'onboarding-survey-follow-up-form'

const FormSchema = z.object({
  building: z.string(),
  coding_experience: z.string(),
})

export type OnboardingSurveyFollowUpValues = z.infer<typeof FormSchema>

const defaultValues: OnboardingSurveyFollowUpValues = {
  building: '',
  coding_experience: '',
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

  const [building, codingExperience] = useWatch({
    control: form.control,
    name: ['building', 'coding_experience'],
  })
  const hasAnswer = building !== '' || codingExperience !== ''

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
                name="building"
                render={({ field }) => (
                  <FormItemLayout label="What are you building?" layout="vertical">
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUILDING_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItemLayout>
                )}
              />

              <FormField
                control={form.control}
                name="coding_experience"
                render={({ field }) => (
                  <FormItemLayout
                    label="How comfortable are you working with code?"
                    layout="vertical"
                  >
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {CODING_EXPERIENCE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label} - {option.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
