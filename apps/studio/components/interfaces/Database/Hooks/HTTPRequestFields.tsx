import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useWatch_Shadcn_ } from 'ui'
import { ChevronDown, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useFieldArray, UseFormReturn } from 'react-hook-form'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { uuidv4 } from 'lib/helpers'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SidePanel,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { WebhookFormValues } from './EditHookPanel.constants'

interface HTTPRequestFieldsProps {
  form: UseFormReturn<WebhookFormValues>
}

const HTTPRequestFields = ({ form }: HTTPRequestFieldsProps) => {
  const { ref } = useParams()
  const { data: selectedProject } = useSelectedProjectQuery()
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')

  const { data: functions } = useEdgeFunctionsQuery({ projectRef: ref })
  const { data: apiKeys } = useAPIKeysQuery(
    { projectRef: ref, reveal: true },
    { enabled: canReadAPIKeys }
  )

  const edgeFunctions = functions ?? []
  const { serviceKey, secretKey } = getKeys(apiKeys)
  const apiKey = secretKey?.api_key ?? serviceKey?.api_key ?? '[YOUR API KEY]'

  const functionType = useWatch_Shadcn_({ control: form.control, name: 'function_type' })

  const {
    fields: headerFields,
    append: appendHeader,
    remove: removeHeader,
  } = useFieldArray({
    control: form.control,
    name: 'httpHeaders',
  })

  const {
    fields: paramFields,
    append: appendParam,
    remove: removeParam,
  } = useFieldArray({
    control: form.control,
    name: 'httpParameters',
  })

  const onAddHeaders = (headers?: { id: string; name: string; value: string }[]) => {
    if (headers) {
      headers.forEach((header) => appendHeader(header))
    } else {
      appendHeader({ id: uuidv4(), name: '', value: '' })
    }
  }

  return (
    <>
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
                    <Input_Shadcn_
                      {...field}
                      placeholder="http://api.com/path/resource"
                    />
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
                        const restUrlTld = restUrl
                          ? new URL(restUrl).hostname.split('.').pop()
                          : 'co'
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
      <SidePanel.Separator />
      <FormSection
        header={<FormSectionLabel className="lg:!col-span-4">HTTP Headers</FormSectionLabel>}
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <div className="space-y-2">
            {headerFields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2">
                <FormField_Shadcn_
                  control={form.control}
                  name={`httpHeaders.${index}.name`}
                  render={({ field }) => (
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                                                className="w-full"
                        placeholder="Header name"
                      />
                    </FormControl_Shadcn_>
                  )}
                />
                <FormField_Shadcn_
                  control={form.control}
                  name={`httpHeaders.${index}.value`}
                  render={({ field }) => (
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                                                className="w-full"
                        placeholder="Header value"
                      />
                    </FormControl_Shadcn_>
                  )}
                />
                <ButtonTooltip
                  type="text"
                  icon={<X />}
                  className="py-4"
                  onClick={() => removeHeader(index)}
                  tooltip={{ content: { side: 'bottom', text: 'Remove header' } }}
                />
              </div>
            ))}
            <div className="flex items-center">
              <Button
                type="default"
                size="tiny"
                icon={<Plus />}
                className={cn(functionType === 'supabase_function' && 'rounded-r-none px-3')}
                onClick={() => onAddHeaders()}
              >
                Add a new header
              </Button>
              {functionType === 'supabase_function' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="default"
                      icon={<ChevronDown />}
                      className="rounded-l-none px-[4px] py-[5px]"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="bottom">
                    <DropdownMenuItem
                      key="add-auth-header"
                      onClick={() => {
                        onAddHeaders([
                          {
                            id: uuidv4(),
                            name: 'Authorization',
                            value: `Bearer ${apiKey}`,
                          },
                          ...(serviceKey?.type === 'secret'
                            ? [{ id: uuidv4(), name: 'apikey', value: apiKey }]
                            : []),
                        ])
                      }}
                    >
                      <div className="space-y-1">
                        <p className="block text-foreground">Add auth header with secret key</p>
                        <p className="text-foreground-light">
                          Required if your edge function enforces JWT verification
                        </p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      key="add-source-header"
                      onClick={() =>
                        onAddHeaders([
                          {
                            id: uuidv4(),
                            name: 'x-supabase-webhook-source',
                            value: `[Use a secret value]`,
                          },
                        ])
                      }
                    >
                      <div className="space-y-1">
                        <p className="block text-foreground">Add custom source header</p>
                        <p className="text-foreground-light">
                          Useful to verify that the edge function was triggered from this webhook
                        </p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection
        header={<FormSectionLabel className="lg:!col-span-4">HTTP Parameters</FormSectionLabel>}
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <div className="space-y-2">
            {paramFields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2">
                <FormField_Shadcn_
                  control={form.control}
                  name={`httpParameters.${index}.name`}
                  render={({ field }) => (
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                                                className="w-full"
                        placeholder="Parameter name"
                      />
                    </FormControl_Shadcn_>
                  )}
                />
                <FormField_Shadcn_
                  control={form.control}
                  name={`httpParameters.${index}.value`}
                  render={({ field }) => (
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                                                className="w-full"
                        placeholder="Parameter value"
                      />
                    </FormControl_Shadcn_>
                  )}
                />
                <ButtonTooltip
                  type="text"
                  className="py-4"
                  icon={<X />}
                  onClick={() => removeParam(index)}
                  tooltip={{ content: { side: 'bottom', text: 'Remove parameter' } }}
                />
              </div>
            ))}
            <div>
              <Button
                type="default"
                size="tiny"
                icon={<Plus />}
                onClick={() => appendParam({ id: uuidv4(), name: '', value: '' })}
              >
                Add a new parameter
              </Button>
            </div>
          </div>
        </FormSectionContent>
      </FormSection>
    </>
  )
}

export default HTTPRequestFields
