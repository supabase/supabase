import { Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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
      description="Provide a link to your metadata .xml file or upload one."
      className="gap-1"
    >
      <div className=" w-96">
        <Tabs
          value={tab}
          onValueChange={(value: string) => setTab(value as 'url' | 'file')}
          className="max-w-2xl"
        >
          <TabsList className="mx-auto gap-5 w-auto">
            <TabsTrigger className=" " value="url">
              URL
            </TabsTrigger>
            <TabsTrigger className=" " value="file">
              Upload file
            </TabsTrigger>
          </TabsList>
          <TabsContent value="url">
            <FormField
              name="metadataXmlUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://example.com/metadata.xml"
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          <TabsContent value="file">
            <FormField
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
                      variant="default"
                      icon={<Upload className="w-4 h-4" />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload XML
                    </Button>
                    {fileName && <span className="text-xs text-foreground-light">{fileName}</span>}
                  </div>
                  <FormMessage />
                </div>
              )}
            />
          </TabsContent>
        </Tabs>
      </div>
    </FormItemLayout>
  )
}
