import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from 'ui'

import {
  BUILDING_MAX_LENGTH,
  BUILDING_PLACEHOLDER,
  buildOnboardingSurveyAnswers,
  formatHeardFromAnswer,
  HEARD_FROM_FOLLOW_UP_BY_VALUE,
  HEARD_FROM_OPTIONS,
  type OnboardingSurveyAnswers,
} from './OnboardingSurvey.constants'

type OnboardingSurveyDialogProps = {
  open: boolean
  description?: string
  isSubmitting?: boolean
  onDismiss: () => void
  onOpenChange: (open: boolean) => void
  onSkip: () => void
  onSubmit: (values: OnboardingSurveyAnswers) => Promise<unknown> | unknown
  title?: string
}

export function OnboardingSurveyDialog({
  open,
  description = 'Answer two optional questions about how you found Supabase and what you are building.',
  isSubmitting = false,
  onDismiss,
  onOpenChange,
  onSkip,
  onSubmit,
  title = 'Help improve Supabase',
}: OnboardingSurveyDialogProps) {
  const [heardFrom, setHeardFrom] = useState('')
  const [heardFromDetail, setHeardFromDetail] = useState('')
  const [building, setBuilding] = useState('')
  const heardFromFollowUp = HEARD_FROM_FOLLOW_UP_BY_VALUE[heardFrom]

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && open && !isSubmitting) {
      onDismiss()
      return
    }

    onOpenChange(nextOpen)
  }

  const handleSubmit = async () => {
    await onSubmit(
      buildOnboardingSurveyAnswers({
        heardFrom: formatHeardFromAnswer(heardFrom, heardFromDetail),
        building,
      })
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="small" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-y-6 pt-4.5 pb-5">
          <p className="text-sm text-foreground-light">{description}</p>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor="onboarding-survey-heard-from">Where did you hear about us?</Label>
            <Select
              value={heardFrom}
              onValueChange={(value) => {
                setHeardFrom(value)
                if (!HEARD_FROM_FOLLOW_UP_BY_VALUE[value]) setHeardFromDetail('')
              }}
            >
              <SelectTrigger id="onboarding-survey-heard-from" className="w-full">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {HEARD_FROM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {heardFromFollowUp && (
              <Input
                aria-label={heardFromFollowUp.label}
                value={heardFromDetail}
                placeholder={heardFromFollowUp.placeholder}
                onChange={(event) => setHeardFromDetail(event.target.value)}
              />
            )}
          </div>

          <div className="flex flex-col gap-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="onboarding-survey-building">What are you building?</Label>
              <span className="text-xs text-foreground-lighter">
                {building.length}/{BUILDING_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              id="onboarding-survey-building"
              value={building}
              rows={3}
              maxLength={BUILDING_MAX_LENGTH}
              placeholder={BUILDING_PLACEHOLDER}
              className="resize-none"
              onChange={(event) => setBuilding(event.target.value)}
            />
          </div>
        </DialogSection>

        <DialogFooter className="px-5 py-4">
          <Button type="default" disabled={isSubmitting} onClick={onSkip}>
            Skip
          </Button>
          <Button loading={isSubmitting} onClick={handleSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
