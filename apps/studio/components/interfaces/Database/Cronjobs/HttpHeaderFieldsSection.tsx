import clsx from 'clsx'
import { ChevronDown, Plus, Trash } from 'lucide-react'
import { useFieldArray } from 'react-hook-form'

import { useParams } from 'common'
import { FormSectionLabel } from 'components/ui/Forms/FormSection'
import { useProjectApiQuery } from 'data/config/project-api-query'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  SheetSection,
} from 'ui'
import { CreateCronJobForm } from './EditCronjobPanel'

export type HTTPHeader = { id: string; name: string; value: string }

interface HTTPHeaderFieldsSectionProps {
  fieldName: 'edgeFunctionValues.httpHeaders' | 'httpRequestValues.httpHeaders'
}

export const HTTPHeaderFieldsSection = ({ fieldName }: HTTPHeaderFieldsSectionProps) => {
  // gets the fields through form context
  const { fields, append, remove } = useFieldArray<CreateCronJobForm>({
    name: fieldName,
  })

  const { ref } = useParams()
  const { data: settings } = useProjectApiQuery({ projectRef: ref })
  const apiService = settings?.autoApiService
  const apiKey = apiService?.serviceApiKey ?? '[YOUR API KEY]'

  return (
    <SheetSection>
      <FormSectionLabel className="lg:!col-span-4">HTTP Headers</FormSectionLabel>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-2">
            <FormField_Shadcn_
              name={`${fieldName}.${index}.name`}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex-1">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_
                      {...field}
                      size="small"
                      className="w-full"
                      placeholder="Header name"
                    />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              name={`${fieldName}.${index}.value`}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex-1">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_
                      {...field}
                      value={field.value}
                      size="small"
                      className="w-full"
                      placeholder="Header value"
                    />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <Button
              type="default"
              icon={<Trash size={12} />}
              onClick={() => remove(index)}
              className="h-[34px] w-[34px]"
            />
          </div>
        ))}
        <div className="flex items-center">
          <Button
            type="default"
            size="tiny"
            icon={<Plus />}
            className={clsx(
              fieldName === 'edgeFunctionValues.httpHeaders' && 'rounded-r-none px-3'
            )}
            onClick={() => append({ name: '', value: '' })}
          >
            Add a new header
          </Button>
          {fieldName === 'edgeFunctionValues.httpHeaders' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="default" className="rounded-l-none px-[4px] py-[5px]">
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                <DropdownMenuItem
                  key="add-auth-header"
                  onClick={() =>
                    append({
                      name: 'Authorization',
                      value: `Bearer ${apiKey}`,
                    })
                  }
                >
                  <div className="space-y-1">
                    <p className="block text-foreground">Add auth header with service key</p>
                    <p className="text-foreground-light">
                      Required if your edge function enforces JWT verification
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  key="add-source-header"
                  onClick={() =>
                    append({
                      name: 'x-supabase-webhook-source',
                      value: `[Use a secret value]`,
                    })
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
    </SheetSection>
  )
}
