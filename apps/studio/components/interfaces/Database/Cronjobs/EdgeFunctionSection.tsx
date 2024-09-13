import Link from 'next/link'
import { UseFormReturn } from 'react-hook-form'

import { useParams } from 'common/hooks'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
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
import { CreateCronJobForm } from './EditCronjobPanel'

interface HTTPRequestFieldsProps {
  form: UseFormReturn<CreateCronJobForm>
}

export const EdgeFunctionSection = ({ form }: HTTPRequestFieldsProps) => {
  const { project: selectedProject } = useProjectContext()
  const { ref } = useParams()
  const { data: functions } = useEdgeFunctionsQuery({ projectRef: ref })

  const edgeFunctions = functions ?? []

  return (
    <SheetSection className="flex flex-col gap-3">
      <FormField_Shadcn_
        control={form.control}
        name="edgeFunctionValues.method"
        render={({ field }) => (
          <FormItem_Shadcn_>
            <FormLabel_Shadcn_>Method</FormLabel_Shadcn_>
            <Select_Shadcn_ onValueChange={field.onChange} defaultValue={field.value}>
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
          name="edgeFunctionValues.method"
          render={({ field }) => (
            <FormItem_Shadcn_>
              <FormLabel_Shadcn_>Edge Function</FormLabel_Shadcn_>
              <Select_Shadcn_ onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl_Shadcn_>
                  <SelectTrigger_Shadcn_>
                    <SelectValue_Shadcn_ placeholder="Select which edge function to trigger" />
                  </SelectTrigger_Shadcn_>
                </FormControl_Shadcn_>
                <SelectContent_Shadcn_>
                  {edgeFunctions.map((fn) => {
                    const restUrl = selectedProject?.restUrl
                    const restUrlTld = restUrl ? new URL(restUrl).hostname.split('.').pop() : 'co'
                    const functionUrl = `https://${ref}.supabase.${restUrlTld}/functions/v1/${fn.slug}`

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
          )}
        />
      ) : null}
      <FormField_Shadcn_
        control={form.control}
        name="edgeFunctionValues.timeoutMs"
        render={({ field }) => (
          <FormItemLayout label="Timeout" layout="vertical" className="gap-1">
            <Input
              {...field}
              type="number"
              actions={<p className="text-foreground-light pr-2">ms</p>}
            />
          </FormItemLayout>
        )}
      />
    </SheetSection>
  )
}
