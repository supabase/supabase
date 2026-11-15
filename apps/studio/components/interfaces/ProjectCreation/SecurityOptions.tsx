import { useParams } from 'common'
import { useId } from 'react'
import { UseFormReturn, useFormState } from 'react-hook-form'
import {
  Checkbox,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  useWatch,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
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
                    Read and write database data through generated API endpoints. Required for
                    database queries with client libraries like{' '}
                    <InlineLink href={`${DOCS_URL}/reference/javascript/introduction`}>
                      supabase-js
                    </InlineLink>
                    .
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <div id={apiAccessOptionsId} hidden={!dataApi} className="ms-7">
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
                      {field.value ? (
                        <>
                          Grant API roles access to new tables in the public schema. Use RLS
                          policies to restrict which records users can access.
                        </>
                      ) : (
                        'New tables require explicit API access grants. Recommended.'
                      )}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

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
                    Enable Row Level Security (RLS) on new tables in the public schema, even when
                    the Data API is off. Add RLS policies to allow users to access records.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {!dataApi && (
            <Admonition
              type="warning"
              title="Database queries through client libraries are disabled"
            >
              Enable the Data API to query your database with supabase-js and similar libraries.
              Other features, such as Auth, remain available.
            </Admonition>
          )}
        </div>
      </FormItemLayout>
    </Panel.Content>
  )
}
