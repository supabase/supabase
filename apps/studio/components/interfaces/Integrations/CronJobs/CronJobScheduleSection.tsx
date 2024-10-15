import { toString as CronToString } from 'cronstrue'
import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

import {
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SheetSection,
} from 'ui'
import { CreateCronJobForm } from './CreateCronJobSheet'

interface CronJobScheduleSectionProps {
  form: UseFormReturn<CreateCronJobForm>
}

const schedules = [
  { name: 'Every minute', expression: '* * * * *' },
  { name: 'Every 5 minutes', expression: '*/5 * * * *' },
  { name: 'Every hour, at 30 minutes', expression: '30 * * * *' },
  { name: 'Every first of the month, at 00:00', expression: '0 0 1 * *' },
  { name: 'Custom', expression: 'custom' },
] as const

export const CronJobScheduleSection = ({ form }: CronJobScheduleSectionProps) => {
  let initialValue = schedules[0].expression as string
  const scheduleValue = form.getValues('schedule')
  if (scheduleValue && scheduleValue.length > 0) {
    initialValue = 'custom'
  }

  const [presetValue, setPresetValue] = useState<string>(initialValue)

  const onChangeSelectValue = (v: string) => {
    setPresetValue(v)
  }

  useEffect(() => {
    if (presetValue !== 'custom') {
      form.setValue('schedule', presetValue)
    }
  }, [presetValue, form])

  return (
    <SheetSection>
      <FormField_Shadcn_
        control={form.control}
        name="schedule"
        render={({ field, fieldState }) => {
          let scheduleString = ''
          try {
            scheduleString = CronToString(field.value)
          } catch {}

          return (
            <FormItem_Shadcn_ className="flex flex-col gap-1">
              <FormLabel_Shadcn_>Schedule</FormLabel_Shadcn_>
              <FormControl_Shadcn_>
                <div className="flex flex-col gap-2">
                  <Select_Shadcn_ onValueChange={onChangeSelectValue} value={presetValue}>
                    <FormControl_Shadcn_>
                      <SelectTrigger_Shadcn_>
                        <SelectValue_Shadcn_ placeholder="Select a method for the HTTP request" />
                      </SelectTrigger_Shadcn_>
                    </FormControl_Shadcn_>
                    <SelectContent_Shadcn_>
                      {schedules.map((schedule) => {
                        return (
                          <SelectItem_Shadcn_ key={schedule.name} value={schedule.expression}>
                            {schedule.name}
                          </SelectItem_Shadcn_>
                        )
                      })}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                  <Input_Shadcn_
                    {...field}
                    disabled={field.disabled || presetValue !== 'custom'}
                    size="large"
                    autoComplete="off"
                  />
                </div>
              </FormControl_Shadcn_>
              <FormMessage_Shadcn_ className="mt-1">
                {scheduleString ? (
                  <span className="text-foreground-light">
                    The cron will be run {/* lowercase the first letter */}
                    {scheduleString
                      .split(' ')
                      .map((s, i) => (i === 0 ? s.toLocaleLowerCase() : s))
                      .join(' ')}
                    .
                  </span>
                ) : (
                  !fieldState.error && <span className="h-5" />
                )}
              </FormMessage_Shadcn_>
            </FormItem_Shadcn_>
          )
        }}
      />
    </SheetSection>
  )
}
