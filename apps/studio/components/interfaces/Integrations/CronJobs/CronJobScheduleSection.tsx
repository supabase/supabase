import { toString as CronToString } from 'cronstrue'
import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useDebounce } from 'use-debounce'

import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SheetSection,
  Switch,
} from 'ui'
import { CreateCronJobForm } from './CreateCronJobSheet'
import { useCronSyntaxGenerateMutation } from '../../../../data/ai/cron-syntax-mutation'

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
  const [inputValue, setInputValue] = useState('')
  const [debouncedValue] = useDebounce(inputValue, 500)
  const [useNaturalLanguage, setUseNaturalLanguage] = useState(false)

  const { mutateAsync: generateCronSyntax, isLoading: isGeneratingCron } =
    useCronSyntaxGenerateMutation()

  const onChangeSelectValue = (v: string) => {
    setPresetValue(v)
  }

  // useEffect(() => {
  //   if (presetValue !== 'custom') {
  //     form.setValue('schedule', presetValue)
  //   }
  // }, [presetValue, form])

  useEffect(() => {
    if (debouncedValue) {
      const handleGenerate = async (prompt: string) => {
        try {
          const expression = await generateCronSyntax({ prompt })

          if (expression) {
            form.setValue('schedule', expression)
            setPresetValue(expression)
          }
        } catch (error) {
          console.error('Error generating cron:', error)
        }
      }

      handleGenerate(debouncedValue)
    }
  }, [debouncedValue, form, generateCronSyntax])

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
                  {/* <Select_Shadcn_ onValueChange={onChangeSelectValue} value={presetValue}>
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
                  </Select_Shadcn_> */}
                  <Input_Shadcn_
                    value={isGeneratingCron ? 'Generating...' : presetValue}
                    disabled={isGeneratingCron}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <FormControl_Shadcn_>
                    {useNaturalLanguage && (
                      <div className="flex gap-2">
                        <Input_Shadcn_
                          placeholder="Describe your schedule in natural language..."
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                        />
                      </div>
                    )}
                  </FormControl_Shadcn_>

                  <div className="flex items-center gap-2 mt-2">
                    <Switch
                      checked={useNaturalLanguage}
                      onCheckedChange={() => setUseNaturalLanguage(!useNaturalLanguage)}
                    />
                    <p className="text-sm text-foreground-light">Use natural language</p>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-foreground-light">Or start from one of these:</p>
                    <ul className="flex gap-2 flex-wrap mt-2">
                      {schedules.map((schedule) => (
                        <li key={schedule.name}>
                          <Button
                            type="outline"
                            onClick={() => setPresetValue(schedule.expression)}
                          >
                            {schedule.name}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
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
