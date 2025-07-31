import { Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SSOConfigFormSchema } from './SSOConfig'

export const SSOMetadata = ({
  form,
}: {
  form: ReturnType<typeof useForm<SSOConfigFormSchema>>
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [tab, setTab] = useState<'url' | 'file'>('url')

  useEffect(() => {
    if (form.getValues('metadataXmlFile')) {
      setTab('file')
    } else if (form.getValues('metadataXmlUrl')) {
      setTab('url')
    }
  }, [form])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    form.clearErrors('metadataXmlFile')
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.xml')) {
      form.setError('metadataXmlFile', {
        type: 'manual',
        message: 'Please upload a valid .xml file',
      })
      return
    }
    try {
      const text = await file.text()
      form.setValue('metadataXmlFile', text, { shouldDirty: true })
      setFileName(file.name)
    } catch (err) {
      form.setError('metadataXmlFile', {
        type: 'manual',
        message: 'Failed to read file',
      })
    }
  }

  return (
    <FormItemLayout
      label="Metadata"
      layout="flex-row-reverse"
      description="Provide a link to your metadata .xml file or upload one"
      className="gap-1"
    >
      <div className=" w-96">
        <Tabs_Shadcn_
          value={tab}
          onValueChange={(value: string) => setTab(value as 'url' | 'file')}
          className="max-w-2xl"
        >
          <TabsList_Shadcn_ className="mx-auto gap-5 w-auto">
            <TabsTrigger_Shadcn_ className=" " value="url">
              URL
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_ className=" " value="file">
              Upload file
            </TabsTrigger_Shadcn_>
          </TabsList_Shadcn_>
          <TabsContent_Shadcn_ value="url">
            <FormField_Shadcn_
              name="metadataXmlUrl"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormControl_Shadcn_>
                    <Input_Shadcn_
                      {...field}
                      placeholder="https://example.com/metadata.xml"
                      autoComplete="off"
                    />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
          </TabsContent_Shadcn_>
          <TabsContent_Shadcn_ value="file">
            <FormField_Shadcn_
              name="metadataXmlUrl"
              render={() => (
                <div className="flex flex-col gap-2 max-w-md">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xml"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="default"
                      size="small"
                      icon={<Upload className="w-4 h-4" />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload XML
                    </Button>
                    {fileName && <span className="text-xs text-foreground-light">{fileName}</span>}
                  </div>
                  <FormMessage_Shadcn_ />
                </div>
              )}
            />
          </TabsContent_Shadcn_>
        </Tabs_Shadcn_>
      </div>
    </FormItemLayout>
  )
}
