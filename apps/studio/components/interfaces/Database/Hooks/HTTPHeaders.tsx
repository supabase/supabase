import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { ChevronDown, Plus, Trash } from 'lucide-react'
import { useFieldArray, UseFormReturn } from 'react-hook-form'
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
  useWatch_Shadcn_,
} from 'ui'

import { WebhookFormValues } from './EditHookPanel.constants'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from '@/components/ui/Forms/FormSection'
import { getKeys, useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { uuidv4 } from '@/lib/helpers'

interface HTTPHeadersProps {
  form: UseFormReturn<WebhookFormValues>
}

export const HTTPHeaders = ({ form }: HTTPHeadersProps) => {
  const { ref } = useParams()
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')

  const { data: apiKeys } = useAPIKeysQuery(
    { projectRef: ref, reveal: true },
    { enabled: canReadAPIKeys }
  )

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

  const onAddHeaders = (headers?: { id: string; name: string; value: string }[]) => {
    if (headers) {
      headers.forEach((header) => appendHeader(header))
    } else {
      appendHeader({ id: uuidv4(), name: '', value: '' })
    }
  }

  return (
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
                    <Input_Shadcn_ {...field} className="w-full" placeholder="Header name" />
                  </FormControl_Shadcn_>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name={`httpHeaders.${index}.value`}
                render={({ field }) => (
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} className="w-full" placeholder="Header value" />
                  </FormControl_Shadcn_>
                )}
              />
              <ButtonTooltip
                type="text"
                icon={<Trash />}
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
  )
}
