import { useParams } from 'common'
import Link from 'next/link'
import { UseFormReturn } from 'react-hook-form'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  useWatch_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { WebhookFormValues } from './EditHookPanel.constants'
import {
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from '@/components/ui/Forms/FormSection'
import { useEdgeFunctionsQuery } from '@/data/edge-functions/edge-functions-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface HTTPRequestConfigProps {
  form: UseFormReturn<WebhookFormValues>
}

export const HTTPRequestConfig = ({ form }: HTTPRequestConfigProps) => {
  const { ref } = useParams()
  const { data: selectedProject } = useSelectedProjectQuery()

  const { data: functions } = useEdgeFunctionsQuery({ projectRef: ref })

  const edgeFunctions = functions ?? []
  const functionType = useWatch_Shadcn_({ control: form.control, name: 'function_type' })

  return (
    <FormSection
      header={
        <FormSectionLabel className="lg:!col-span-4">
          {functionType === 'http_request'
            ? 'HTTP Request'
            : functionType === 'supabase_function'
              ? 'Edge Function'
              : ''}
        </FormSectionLabel>
      }
    >
      <FormSectionContent loading={false} className="lg:!col-span-8">
        <FormField_Shadcn_
          control={form.control}
          name="http_method"
          render={({ field }) => (
            <FormItemLayout label="Method" layout="vertical" className="gap-1">
              <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                <FormControl_Shadcn_>
                  <SelectTrigger_Shadcn_>
                    <SelectValue_Shadcn_ />
                  </SelectTrigger_Shadcn_>
                </FormControl_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectItem_Shadcn_ value="GET">GET</SelectItem_Shadcn_>
                  <SelectItem_Shadcn_ value="POST">POST</SelectItem_Shadcn_>
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </FormItemLayout>
          )}
        />

        {functionType === 'http_request' ? (
          <FormField_Shadcn_
            control={form.control}
            name="http_url"
            render={({ field }) => (
              <FormItemLayout
                label="URL"
                layout="vertical"
                className="gap-1"
                description="URL of the HTTP request. Must include HTTP/HTTPS"
              >
                <FormControl_Shadcn_>
                  <Input_Shadcn_ {...field} placeholder="http://api.com/path/resource" />
                </FormControl_Shadcn_>
              </FormItemLayout>
            )}
          />
        ) : functionType === 'supabase_function' && edgeFunctions.length === 0 ? (
          <div className="space-y-1">
            <p className="text-sm text-foreground-light">Select which edge function to trigger</p>
            <div className="px-4 py-4 border rounded bg-surface-300 border-strong flex items-center justify-between space-x-4">
              <p className="text-sm">No edge functions created yet</p>
              <Button asChild>
                <Link href={`/project/${ref}/functions`}>Create an edge function</Link>
              </Button>
            </div>
          </div>
        ) : functionType === 'supabase_function' && edgeFunctions.length > 0 ? (
          <FormField_Shadcn_
            control={form.control}
            name="http_url"
            render={({ field }) => (
              <FormItemLayout
                label="Select which edge function to trigger"
                layout="vertical"
                className="gap-1"
              >
                <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                  <FormControl_Shadcn_>
                    <SelectTrigger_Shadcn_>
                      <SelectValue_Shadcn_ placeholder="Select an edge function" />
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
              </FormItemLayout>
            )}
          />
        ) : null}

        <FormField_Shadcn_
          control={form.control}
          name="timeout_ms"
          render={({ field }) => (
            <FormItemLayout
              label="Timeout"
              labelOptional="Between 1000ms to 10,000ms"
              layout="vertical"
              className="gap-1"
            >
              <FormControl_Shadcn_>
                <div className="relative">
                  <Input_Shadcn_
                    {...field}
                    type="number"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-light text-sm">
                    ms
                  </span>
                </div>
              </FormControl_Shadcn_>
            </FormItemLayout>
          )}
        />
      </FormSectionContent>
    </FormSection>
  )
}
