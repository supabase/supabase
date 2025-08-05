import Link from 'next/link'
import { UseFormReturn } from 'react-hook-form'

import { useParams } from 'common/hooks'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useEffect, useMemo } from 'react'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SheetSection,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { CreateCronJobForm } from './CreateCronJobSheet'

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
  const { project: selectedProject } = useProjectContext()
  const { data: functions, isSuccess, isLoading } = useEdgeFunctionsQuery({ projectRef: ref })

  const edgeFunctions = useMemo(() => functions ?? [], [functions])

  // Only set a default value if the field is empty
  useEffect(() => {
    if (isSuccess && edgeFunctions.length > 0 && !form.getValues('values.edgeFunctionName')) {
      const fn = edgeFunctions[0]
      const functionUrl = buildFunctionUrl(
        fn.slug,
        selectedProject?.ref || '',
        selectedProject?.restUrl
      )
      form.setValue('values.edgeFunctionName', functionUrl)
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
          <div className="px-4 py-4 border rounded bg-surface-300 border-strong flex items-center justify-between space-x-4">
            <p className="text-sm">No edge functions created yet</p>
            <Button asChild>
              <Link href={`/project/${ref}/functions`}>Create an edge function</Link>
            </Button>
          </div>
        </div>
      ) : edgeFunctions.length > 0 ? (
        <FormField_Shadcn_
          control={form.control}
          name="values.edgeFunctionName"
          render={({ field }) => {
            return (
              <FormItem_Shadcn_>
                <FormLabel_Shadcn_>Edge Function</FormLabel_Shadcn_>
                <Select_Shadcn_
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoading}
                >
                  <FormControl_Shadcn_>
                    <SelectTrigger_Shadcn_>
                      <SelectValue_Shadcn_ placeholder="Select which edge function to trigger" />
                    </SelectTrigger_Shadcn_>
                  </FormControl_Shadcn_>
                  <SelectContent_Shadcn_>
                    {edgeFunctions.map((fn) => {
                      const functionUrl = buildFunctionUrl(
                        fn.slug,
                        selectedProject?.ref || '',
                        selectedProject?.restUrl
                      )

                      return (
                        <SelectItem_Shadcn_ key={fn.id} value={functionUrl}>
                          {fn.name}
                        </SelectItem_Shadcn_>
                      )
                    })}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
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
