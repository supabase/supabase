import { useParams } from 'common/hooks'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Check, ChevronsUpDown } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useId, useMemo, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SheetSection,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateCronJobForm } from './CreateCronJobSheet/CreateCronJobSheet.constants'

interface HTTPRequestFieldsProps {
  form: UseFormReturn<CreateCronJobForm>
}

const buildFunctionUrl = (slug: string, projectRef: string, restUrl?: string) => {
  const restUrlTld = restUrl ? new URL(restUrl).hostname.split('.').pop() : 'co'
  const functionUrl = `https://${projectRef}.supabase.${restUrlTld}/functions/v1/${slug}`
  return functionUrl
}

export const EdgeFunctionSection = ({ form }: HTTPRequestFieldsProps) => {
  const { ref } = useParams()
  const { data: selectedProject } = useSelectedProjectQuery()
  const {
    data: functions,
    isSuccess,
    isPending: isLoading,
  } = useEdgeFunctionsQuery({ projectRef: ref })
  const [open, setOpen] = useState(false)
  const listboxId = useId()
  const edgeFunctions = useMemo(
    () =>
      functions?.map((fn) => ({
        ...fn,
        url: buildFunctionUrl(fn.slug, selectedProject?.ref || '', selectedProject?.restUrl),
      })) ?? [],
    [functions, selectedProject]
  )

  // Only set a default value if the field is empty
  useEffect(() => {
    if (isSuccess && edgeFunctions.length > 0 && !form.getValues('values.edgeFunctionName')) {
      const fn = edgeFunctions[0]
      form.setValue('values.edgeFunctionName', fn.url)
    }
  }, [edgeFunctions, form, isSuccess, selectedProject?.ref, selectedProject?.restUrl])

  return (
    <SheetSection className="flex flex-col gap-6">
      <FormField_Shadcn_
        control={form.control}
        name="values.method"
        render={({ field }) => (
          <FormItem_Shadcn_>
            <FormLabel_Shadcn_>Method</FormLabel_Shadcn_>
            <Select_Shadcn_ onValueChange={field.onChange} value={field.value}>
              <FormControl_Shadcn_>
                <SelectTrigger_Shadcn_>
                  <SelectValue_Shadcn_ placeholder="Select a method for the API call" />
                </SelectTrigger_Shadcn_>
              </FormControl_Shadcn_>
              <SelectContent_Shadcn_>
                <SelectItem_Shadcn_ value="GET">GET</SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="POST">POST</SelectItem_Shadcn_>
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
            <FormMessage_Shadcn_ />
          </FormItem_Shadcn_>
        )}
      />

      {edgeFunctions.length === 0 ? (
        <div className="space-y-1">
          <p className="text-sm text-foreground-light">Select which edge function to trigger</p>
          {isLoading ? (
            <Button type="default" className="justify-start" block size="small" loading>
              Loading edge functions...
            </Button>
          ) : (
            <div className="px-4 py-4 border rounded bg-surface-300 border-strong flex items-center justify-between space-x-4">
              <p className="text-sm">No edge functions created yet</p>
              <Button asChild>
                <Link href={`/project/${ref}/functions`}>Create an edge function</Link>
              </Button>
            </div>
          )}
        </div>
      ) : edgeFunctions.length > 0 ? (
        <FormField_Shadcn_
          control={form.control}
          name="values.edgeFunctionName"
          render={({ field }) => {
            const selectedFunction = edgeFunctions.find((fn) => fn.url === field.value)

            return (
              <FormItem_Shadcn_>
                <FormLabel_Shadcn_>Edge Function</FormLabel_Shadcn_>
                <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
                  <PopoverTrigger_Shadcn_ asChild>
                    <FormControl_Shadcn_>
                      <Button
                        type="default"
                        role="combobox"
                        aria-expanded={open}
                        aria-controls={listboxId}
                        className={cn(
                          'w-full justify-between',
                          !field.value && 'text-muted-foreground'
                        )}
                        size="small"
                        iconRight={
                          <ChevronsUpDown
                            className="ml-2 h-4 w-4 shrink-0 opacity-50"
                            strokeWidth={1}
                          />
                        }
                      >
                        {selectedFunction
                          ? selectedFunction.name
                          : 'Select which edge function to trigger'}
                      </Button>
                    </FormControl_Shadcn_>
                  </PopoverTrigger_Shadcn_>
                  <PopoverContent_Shadcn_ id={listboxId} className="p-0" sameWidthAsTrigger>
                    <Command_Shadcn_>
                      <CommandInput_Shadcn_ placeholder="Search edge functions..." />
                      <CommandList_Shadcn_>
                        <CommandEmpty_Shadcn_>No edge function found.</CommandEmpty_Shadcn_>
                        <CommandGroup_Shadcn_>
                          <ScrollArea className={edgeFunctions.length > 7 ? 'h-[210px]' : ''}>
                            {edgeFunctions.map((fn) => {
                              return (
                                <CommandItem_Shadcn_
                                  value={fn.name}
                                  key={fn.id}
                                  onSelect={() => {
                                    field.onChange(fn.url === field.value ? '' : fn.url)
                                    setOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      fn.url === field.value ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {fn.name}
                                </CommandItem_Shadcn_>
                              )
                            })}
                          </ScrollArea>
                        </CommandGroup_Shadcn_>
                      </CommandList_Shadcn_>
                    </Command_Shadcn_>
                  </PopoverContent_Shadcn_>
                </Popover_Shadcn_>
                <FormMessage_Shadcn_ />
              </FormItem_Shadcn_>
            )
          }}
        />
      ) : null}
      <FormField_Shadcn_
        control={form.control}
        name="values.timeoutMs"
        render={({ field: { ref, ...rest } }) => (
          <FormItemLayout label="Timeout" layout="vertical" className="gap-1">
            <Input
              {...rest}
              type="number"
              placeholder="1000"
              actions={<p className="text-foreground-light pr-2">ms</p>}
            />
          </FormItemLayout>
        )}
      />
    </SheetSection>
  )
}
