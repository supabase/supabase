import { Button, Listbox, Input, SidePanel, IconTrash, IconPlus } from 'ui'
import { FormSection, FormSectionLabel, FormSectionContent } from 'components/ui/Forms'
import { HTTPArgument } from './EditHookPanel'

interface HTTPRequestFieldsProps {
  httpHeaders: HTTPArgument[]
  httpParameters: HTTPArgument[]
  onAddHeader: () => void
  onUpdateHeader: (idx: number, property: string, value: string) => void
  onRemoveHeader: (idx: number) => void
  onAddParameter: () => void
  onUpdateParameter: (idx: number, property: string, value: string) => void
  onRemoveParameter: (idx: number) => void
}

const HTTPRequestFields = ({
  httpHeaders = [],
  httpParameters = [],
  onAddHeader,
  onUpdateHeader,
  onRemoveHeader,
  onAddParameter,
  onUpdateParameter,
  onRemoveParameter,
}: HTTPRequestFieldsProps) => {
  return (
    <>
      <FormSection
        header={<FormSectionLabel className="lg:!col-span-4">HTTP Request</FormSectionLabel>}
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
          <Input
            id="http_url"
            name="http_url"
            label="URL"
            placeholder="http://api.com/path/resource"
            descriptionText="URL of the HTTP request. Must include HTTP/HTTPS"
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
            <div>
              <Button type="dashed" size="tiny" icon={<IconPlus />} onClick={onAddHeader}>
                Add a new header
              </Button>
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
              <Button type="dashed" size="tiny" icon={<IconPlus />} onClick={onAddParameter}>
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
