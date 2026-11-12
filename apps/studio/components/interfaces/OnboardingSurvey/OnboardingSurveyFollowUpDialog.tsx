import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence } from 'motion/react'
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

import { ORG_SIZE_DEFAULT, ORG_SIZE_TYPES } from '../Organization/NewOrg/OrganizationDetailsFields'
import {
  BUILDING_OPTIONS,
  CAN_CODE_OPTIONS,
  SURVEY_ORG_KIND_OPTIONS,
} from './OnboardingSurvey.constants'
import { OnboardingSurveySelect } from './OnboardingSurveySelect'
import { FormSectionCollapse } from '@/components/ui/FormSectionCollapse'

const FORM_ID = 'onboarding-survey-follow-up-form'

const FormSchema = z.object({
  kind: z.string(),
  size: z.string(),
  building: z.string(),
  can_code: z.string(),
})

export type OnboardingSurveyFollowUpValues = z.infer<typeof FormSchema>

const defaultValues: OnboardingSurveyFollowUpValues = {
  kind: '',
  size: ORG_SIZE_DEFAULT,
  building: '',
  can_code: '',
}

type OnboardingSurveyFollowUpDialogProps = {
  open: boolean
  isSubmitting: boolean
  /** Skip, or the dialog closing any other way */
  onClose: () => void
  onSubmit: (values: OnboardingSurveyFollowUpValues) => void
}

export function OnboardingSurveyFollowUpDialog({
  open,
  isSubmitting,
  onClose,
  onSubmit,
}: OnboardingSurveyFollowUpDialogProps) {
  const form = useForm<OnboardingSurveyFollowUpValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const [kind, building, canCode] = useWatch({
    control: form.control,
    name: ['kind', 'building', 'can_code'],
  })
  const hasAnswer = kind !== '' || building !== '' || canCode !== ''

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent size="small" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Tell us about your organization</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form {...form}>
          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="flex flex-col gap-y-5 pt-4.5 pb-5">
              <p className="text-sm text-foreground-light">
                All questions are optional. Your answers help us improve Supabase.
              </p>

              {/* Size and What are you building? appear once Who is this org for? is answered */}
              <div>
                <FormField
                  control={form.control}
                  name="kind"
                  render={({ field }) => (
                    <FormItemLayout label="Who is this org for?" layout="vertical">
                      <FormControl>
                        <OnboardingSurveySelect
                          value={field.value}
                          onValueChange={field.onChange}
                          options={SURVEY_ORG_KIND_OPTIONS}
                        />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />

                <AnimatePresence initial={false}>
                  {kind === 'COMPANY' && (
                    <FormSectionCollapse>
                      <div className="pt-5">
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
                      </div>
                    </FormSectionCollapse>
                  )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                  {kind !== '' && (
                    <FormSectionCollapse>
                      <div className="pt-5">
                        <FormField
                          control={form.control}
                          name="building"
                          render={({ field }) => (
                            <FormItemLayout label="What are you building?" layout="vertical">
                              <FormControl>
                                <OnboardingSurveySelect
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  options={BUILDING_OPTIONS}
                                />
                              </FormControl>
                            </FormItemLayout>
                          )}
                        />
                      </div>
                    </FormSectionCollapse>
                  )}
                </AnimatePresence>

                <div className="pt-5">
                  <FormField
                    control={form.control}
                    name="can_code"
                    render={({ field }) => (
                      <FormItemLayout label="Do you know how to code?" layout="vertical">
                        <FormControl>
                          <OnboardingSurveySelect
                            value={field.value}
                            onValueChange={field.onChange}
                            options={CAN_CODE_OPTIONS}
                          />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </div>
              </div>
            </DialogSection>
          </form>
        </Form>

        <DialogFooter className="px-5 py-4">
          <Button variant="default" disabled={isSubmitting} onClick={onClose}>
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
