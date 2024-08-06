import clsx from 'clsx'
import Link from 'next/link'

import { useParams } from 'common/hooks'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { uuidv4 } from 'lib/helpers'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconChevronDown,
  IconPlus,
  IconTrash,
  Input,
  Listbox,
  SidePanel,
} from 'ui'
import { HTTPArgument } from './EditHookPanel'

interface HTTPRequestFieldsProps {
  type: 'http_request' | 'supabase_function'
  errors: any
  httpHeaders: HTTPArgument[]
  httpParameters: HTTPArgument[]
  onAddHeader: (header?: any) => void
  onUpdateHeader: (idx: number, property: string, value: string) => void
  onRemoveHeader: (idx: number) => void
  onAddParameter: () => void
  onUpdateParameter: (idx: number, property: string, value: string) => void
  onRemoveParameter: (idx: number) => void
}

const HTTPRequestFields = ({
  type,
  errors,
  httpHeaders = [],
  httpParameters = [],
  onAddHeader,
  onUpdateHeader,
  onRemoveHeader,
  onAddParameter,
  onUpdateParameter,
  onRemoveParameter,
}: HTTPRequestFieldsProps) => {
  const { project: selectedProject } = useProjectContext()
  const { ref } = useParams()
  const { data: settings } = useProjectApiQuery({ projectRef: ref })
  const { data: functions } = useEdgeFunctionsQuery({ projectRef: ref })

  const edgeFunctions = functions ?? []
  const apiService = settings?.autoApiService
  const apiKey = apiService?.serviceApiKey ?? '[YOUR API KEY]'

  return (
    <>
      <FormSection
        header={
          <FormSectionLabel className="lg:!col-span-4">
            {type === 'http_request'
              ? 'HTTP Request'
              : type === 'supabase_function'
                ? 'Edge Function'
                : ''}
          </FormSectionLabel>
        }
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <Listbox id="http_method" name="http_method" size="medium" label="Method">
            <Listbox.Option id="GET" value="GET" label="GET">
              GET
            </Listbox.Option>
            <Listbox.Option id="POST" value="POST" label="POST">
              POST
            </Listbox.Option>
          </Listbox>
          {type === 'http_request' ? (
            <Input
              id="http_url"
              name="http_url"
              label="URL"
              placeholder="http://api.com/path/resource"
              descriptionText="URL of the HTTP request. Must include HTTP/HTTPS"
            />
          ) : type === 'supabase_function' && edgeFunctions.length === 0 ? (
            <div className="space-y-1">
              <p className="text-sm text-foreground-light">Select which edge function to trigger</p>
              <div className="px-4 py-4 border rounded bg-surface-300 border-strong flex items-center justify-between space-x-4">
                <p className="text-sm">No edge functions created yet</p>
                <Button asChild>
                  <Link href={`/project/${ref}/functions`}>Create an edge function</Link>
                </Button>
              </div>
              {errors.http_url && <p className="text-sm text-red-900">{errors.http_url}</p>}
            </div>
          ) : type === 'supabase_function' && edgeFunctions.length > 0 ? (
            <Listbox id="http_url" name="http_url" label="Select which edge function to trigger">
              {edgeFunctions.map((fn) => {
                const restUrl = selectedProject?.restUrl
                const restUrlTld = restUrl ? new URL(restUrl).hostname.split('.').pop() : 'co'
                const functionUrl = `https://${ref}.supabase.${restUrlTld}/functions/v1/${fn.slug}`

                return (
                  <Listbox.Option key={fn.id} id={functionUrl} value={functionUrl} label={fn.name}>
                    {fn.name}
                  </Listbox.Option>
                )
              })}
            </Listbox>
          ) : null}
          <Input
            id="timeout_ms"
            name="timeout_ms"
            label="Timeout"
            labelOptional="Between 1000ms to 5000ms"
            type="number"
            actions={<p className="text-foreground-light pr-2">ms</p>}
          />
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection
        header={<FormSectionLabel className="lg:!col-span-4">HTTP Headers</FormSectionLabel>}
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <div className="space-y-2">
            {httpHeaders.map((header, idx: number) => (
              <div key={header.id} className="flex items-center space-x-2">
                <Input
                  value={header.name}
                  size="small"
                  className="w-full"
                  placeholder="Header name"
                  onChange={(event: any) => onUpdateHeader(idx, 'name', event.target.value)}
                />
                <Input
                  value={header.value}
                  size="small"
                  className="w-full"
                  placeholder="Header value"
                  onChange={(event: any) => onUpdateHeader(idx, 'value', event.target.value)}
                />
                <Button
                  type="default"
                  size="medium"
                  icon={<IconTrash size="tiny" />}
                  className="px-[10px] py-[9px]"
                  onClick={() => onRemoveHeader(idx)}
                />
              </div>
            ))}
            <div className="flex items-center">
              <Button
                type="default"
                size="tiny"
                icon={<IconPlus />}
                className={clsx(type === 'supabase_function' && 'rounded-r-none px-3')}
                onClick={onAddHeader}
              >
                Add a new header
              </Button>
              {type === 'supabase_function' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="default" className="rounded-l-none px-[4px] py-[5px]">
                      <IconChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="bottom">
                    <DropdownMenuItem
                      key="add-auth-header"
                      onClick={() =>
                        onAddHeader({
                          id: uuidv4(),
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
                        onAddHeader({
                          id: uuidv4(),
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
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection
        header={<FormSectionLabel className="lg:!col-span-4">HTTP Parameters</FormSectionLabel>}
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <div className="space-y-2">
            {httpParameters.map((parameter, idx: number) => (
              <div key={parameter.id} className="flex items-center space-x-2">
                <Input
                  size="small"
                  value={parameter.name}
                  className="w-full"
                  placeholder="Parameter name"
                  onChange={(event: any) => onUpdateParameter(idx, 'name', event.target.value)}
                />
                <Input
                  size="small"
                  value={parameter.value}
                  className="w-full"
                  placeholder="Parameter value"
                  onChange={(event: any) => onUpdateParameter(idx, 'value', event.target.value)}
                />
                <Button
                  type="default"
                  size="medium"
                  icon={<IconTrash size="tiny" />}
                  className="px-[10px] py-[9px]"
                  onClick={() => onRemoveParameter(idx)}
                />
              </div>
            ))}
            <div>
              <Button type="default" size="tiny" icon={<IconPlus />} onClick={onAddParameter}>
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
