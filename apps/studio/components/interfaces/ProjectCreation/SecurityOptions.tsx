import { useParams } from 'common'
import { useId } from 'react'
import { UseFormReturn, useFormState } from 'react-hook-form'
import {
  Checkbox,
  Collapsible,
  CollapsibleContent,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  useWatch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateProjectForm } from './ProjectCreation.schema'
import { InlineLink } from '@/components/ui/InlineLink'
import Panel from '@/components/ui/Panel'
import { useTrackDefaultPrivilegesExposure } from '@/hooks/misc/useDataApiRevokeOnCreateDefault'
import { DOCS_URL } from '@/lib/constants'

interface SecurityOptionsProps {
  form: UseFormReturn<CreateProjectForm>
  layout?: 'vertical' | 'horizontal'
  surface: 'main' | 'vercel'
}

export const SecurityOptions = ({ form, layout = 'horizontal', surface }: SecurityOptionsProps) => {
  const { slug } = useParams()
  const apiAccessOptionsId = useId()
  const dataApi = useWatch({ control: form.control, name: 'dataApi' })
  const dataApiDefaultPrivileges = useWatch({
    control: form.control,
    name: 'dataApiDefaultPrivileges',
  })
  const { dirtyFields } = useFormState({ control: form.control })
  const hasUserModified = !!dirtyFields.dataApiDefaultPrivileges

  useTrackDefaultPrivilegesExposure(
    surface === 'main'
      ? {
          surface: 'main',
          dataApiDefaultPrivileges: dataApiDefaultPrivileges ?? true,
          hasUserModified,
        }
      : {
          surface: 'vercel',
          orgSlug: slug,
          dataApiDefaultPrivileges: dataApiDefaultPrivileges ?? true,
          hasUserModified,
        }
  )

  return (
    <Panel.Content className="pb-8">
      <FormItemLayout layout={layout} label="Data access" isReactForm={false}>
        <div className="flex flex-col gap-4">
          <Collapsible open={dataApi}>
            <FormField
              name="dataApi"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex items-start gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={field.disabled}
                      aria-expanded={dataApi}
                      aria-controls={apiAccessOptionsId}
                      onCheckedChange={(value) => field.onChange(value === true)}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="text-sm text-foreground">Enable Data API</FormLabel>
                    <FormDescription className="text-foreground-lighter">
                      Query your database through generated{' '}
                      <InlineLink href={`${DOCS_URL}/guides/api`}>API endpoints</InlineLink>.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <CollapsibleContent
              id={apiAccessOptionsId}
              aria-hidden={!dataApi}
              inert={!dataApi}
              className="data-open:animate-collapsible-down-clipped data-closed:animate-collapsible-up-clipped motion-reduce:animate-none"
            >
              <div className="pt-4">
                <FormField
                  name="dataApiDefaultPrivileges"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          disabled={field.disabled || !dataApi}
                          onCheckedChange={(value) => field.onChange(value === true)}
                        />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel className="text-sm text-foreground">
                          Automatically grant API access to new tables
                        </FormLabel>
                        <FormDescription className="text-foreground-lighter">
                          Applies to the public schema. Leave off to grant access per table.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <FormField
            name="enableRlsEventTrigger"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex items-start gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    disabled={field.disabled}
                    onCheckedChange={(value) => field.onChange(value === true)}
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="text-sm text-foreground">
                    Enable RLS on new tables automatically
                  </FormLabel>
                  <FormDescription className="text-foreground-lighter">
                    Applies to the public schema. Add{' '}
                    <InlineLink href={`${DOCS_URL}/guides/database/postgres/row-level-security`}>
                      RLS policies
                    </InlineLink>{' '}
                    to allow access.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
      </FormItemLayout>
    </Panel.Content>
  )
}
