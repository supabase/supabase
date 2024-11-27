import { toString as CronToString } from 'cronstrue'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useDebounce } from 'use-debounce'

import { useCompletion } from 'ai/react'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useCronTimezoneQuery } from 'data/database-cron-jobs/database-cron-timezone-query'
import { BASE_PATH } from 'lib/constants'
import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  Button,
  cn,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  SheetSection,
  Switch,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { CreateCronJobForm } from './CreateCronJobSheet'
import { getScheduleMessage, secondsPattern } from './CronJobs.utils'
import CronSyntaxChart from './CronSyntaxChart'

interface CronJobScheduleSectionProps {
  form: UseFormReturn<CreateCronJobForm>
  supportsSeconds: boolean
}

export const CronJobScheduleSection = ({ form, supportsSeconds }: CronJobScheduleSectionProps) => {
  const { project } = useProjectContext()
  const initialValue = form.getValues('schedule')
  const schedule = form.watch('schedule')

  const [presetValue, setPresetValue] = useState<string>(initialValue)
  const [inputValue, setInputValue] = useState(initialValue)
  const [debouncedValue] = useDebounce(inputValue, 750)
  const [useNaturalLanguage, setUseNaturalLanguage] = useState(false)
  const [scheduleString, setScheduleString] = useState('')

  const PRESETS = [
    ...(supportsSeconds ? [{ name: 'Every 30 seconds', expression: '30 seconds' }] : []),
    { name: 'Every minute', expression: '* * * * *' },
    { name: 'Every 5 minutes', expression: '*/5 * * * *' },
    { name: 'Every first of the month, at 00:00', expression: '0 0 1 * *' },
    { name: 'Every night at midnight', expression: '0 0 * * *' },
    { name: 'Every Monday at 2 AM', expression: '0 2 * * 1' },
  ] as const

  const { complete: generateCronSyntax, isLoading: isGeneratingCron } = useCompletion({
    api: `${BASE_PATH}/api/ai/sql/cron`,
    onResponse: async (response) => {
      if (response.ok) {
        // remove quotes from the cron expression
        const expression = (await response.text()).trim().replace(/^"|"$/g, '')
        form.setValue('schedule', expression)
        setPresetValue(expression)
        setScheduleString(CronToString(expression))
      }
    },
    onError: (error) => {
      console.error('Error generating cron:', error)
    },
  })

  const { data: timezone } = useCronTimezoneQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  useEffect(() => {
    if (!useNaturalLanguage || !debouncedValue) return
    generateCronSyntax(debouncedValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue, useNaturalLanguage])

  useEffect(() => {
    if (!inputValue || inputValue.length < 5) return // set a min length before showing invalid message

    // update the cronstrue string when the input value changes
    try {
      setScheduleString(CronToString(inputValue))
      form.setValue('schedule', inputValue)
    } catch (error) {
      console.error('Error converting cron expression to string:', error)
    }
  }, [form, inputValue])

  useEffect(() => {
    if (useNaturalLanguage) return

    setPresetValue(schedule)

    if (!schedule) {
      setScheduleString('')
      return
    }

    try {
      // Don't allow seconds-based schedules if seconds aren't supported
      if (!supportsSeconds && secondsPattern.test(schedule)) {
        setScheduleString('Invalid cron expression')
        return
      }

      setScheduleString(CronToString(schedule))
    } catch (error) {
      setScheduleString('Invalid cron expression')
      console.error('Error converting cron expression to string:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule])

  return (
    <SheetSection>
      <FormField_Shadcn_
        control={form.control}
        name="schedule"
        render={({ field }) => {
          return (
            <FormItem_Shadcn_ className="flex flex-col gap-1">
              <div className="flex flex-row justify-between">
                <FormLabel_Shadcn_>Schedule</FormLabel_Shadcn_>
                <span className="text-foreground-lighter text-xs">
                  {useNaturalLanguage
                    ? 'Describe your schedule in words'
                    : 'Enter a cron expression'}
                </span>
              </div>

              <FormControl_Shadcn_>
                <div className="flex flex-col gap-y-2">
                  {useNaturalLanguage ? (
                    <Input
                      value={inputValue}
                      placeholder="E.g. every 5 minutes"
                      className={cn(!useNaturalLanguage && 'hidden')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                        }
                      }}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                  ) : (
                    <Input_Shadcn_
                      {...field}
                      autoComplete="off"
                      placeholder="* * * * *"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                        }
                      }}
                    />
                  )}
                  <FormMessage_Shadcn_ />

                  <div className="flex items-center gap-2 mt-2">
                    <Switch
                      checked={useNaturalLanguage}
                      onCheckedChange={() => {
                        setUseNaturalLanguage(!useNaturalLanguage)
                        setInputValue('')
                        setPresetValue('')
                        setScheduleString('')
                        form.setValue('schedule', '')
                      }}
                    />
                    <p className="text-sm text-foreground-light">Use natural language</p>
                  </div>

                  <div className="mt-2">
                    <ul className="flex gap-2 flex-wrap mt-2">
                      {PRESETS.map((preset) => (
                        <li key={preset.name}>
                          <Button
                            type="outline"
                            onClick={() => {
                              setUseNaturalLanguage(false)
                              form.setValue('schedule', preset.expression)
                              form.trigger('schedule')
                              setPresetValue(preset.expression)
                            }}
                          >
                            {preset.name}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Accordion_Shadcn_ type="single" collapsible className="mt-2 pb-2">
                    <AccordionItem_Shadcn_ value="item-1" className="border-none">
                      <AccordionTrigger_Shadcn_ className="text-xs text-foreground-light font-normal gap-2 justify-start py-1 ">
                        View syntax chart
                      </AccordionTrigger_Shadcn_>
                      <AccordionContent_Shadcn_ asChild className="!pb-0">
                        <CronSyntaxChart />
                      </AccordionContent_Shadcn_>
                    </AccordionItem_Shadcn_>
                  </Accordion_Shadcn_>
                </div>
              </FormControl_Shadcn_>

              <div className="bg-surface-100 p-4 rounded grid gap-y-4 border">
                <h4 className="text-sm text-foreground">
                  Schedule {timezone ? `(${timezone})` : ''}
                </h4>
                {scheduleString ? (
                  <span
                    className={cn(
                      'text-xl font-mono',
                      isGeneratingCron ? 'animate-pulse text-foreground-lighter' : 'text-foreground'
                    )}
                  >
                    {isGeneratingCron ? <CronSyntaxLoader /> : presetValue || '* * * * *'}
                  </span>
                ) : (
                  <span className="text-xl font-mono text-foreground-lighter">
                    {isGeneratingCron ? <CronSyntaxLoader /> : presetValue || '* * * * *'}
                  </span>
                )}
                {!inputValue && !isGeneratingCron && !scheduleString ? (
                  <span className="text-sm text-foreground-light">
                    Describe your schedule above
                  </span>
                ) : (
                  <span className="text-sm text-foreground-light flex items-center gap-2">
                    {isGeneratingCron ? (
                      <LoadingDots />
                    ) : (
                      getScheduleMessage(scheduleString, schedule)
                    )}
                  </span>
                )}
              </div>
            </FormItem_Shadcn_>
          )
        }}
      />
    </SheetSection>
  )
}

const CronSyntaxLoader = () => {
  return (
    <div className="flex gap-2">
      {['*', '*', '*', '*', '*'].map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: i * 0.15,
          }}
        >
          {char}
        </motion.span>
      ))}
    </div>
  )
}

const LoadingDots = () => {
  return (
    <span className="inline-flex items-center">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: i * 0.2,
          }}
        >
          .
        </motion.span>
      ))}
    </span>
  )
}
