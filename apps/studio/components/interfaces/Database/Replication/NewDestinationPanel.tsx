import { zodResolver } from '@hookform/resolvers/zod'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SidePanel,
  TextArea_Shadcn_,
} from 'ui'
import * as z from 'zod'

interface NewDestinationPanelProps {
  visible: boolean
  onCancel: () => void
  onConfirm: () => void
}

const NewDestinationPanel = ({ visible, onCancel, onConfirm }: NewDestinationPanelProps) => {
  const formId = 'destination-editor'
  const types = ['BigQuery'] as const
  const TypeEnum = z.enum(types)
  const FormSchema = z.object({
    type: TypeEnum,
    name: z.string(),
    projectId: z.string(),
    datasetId: z.string(),
    serviceAccountKey: z.string(),
  })
  const defaultValues = {
    type: TypeEnum.enum.BigQuery,
    name: '',
    projectId: '',
    datasetId: '',
    serviceAccountKey: '',
  }
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues,
  })
  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    console.log(`Form submitted: ${JSON.stringify(data)}`)
    form.reset(defaultValues)
  }
  const submitRef = useRef<HTMLButtonElement>(null)

  return (
    <SidePanel
      visible={visible}
      header="New Destination"
      onCancel={onCancel}
      onConfirm={() => {
        if (submitRef.current) {
          submitRef.current.click()
          onConfirm()
        }
      }}
      confirmText={'Create'}
    >
      <SidePanel.Content className="flex flex-col py-4 gap-y-4">
        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <FormField_Shadcn_
              name="type"
              control={form.control}
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>Type</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <Select_Shadcn_ value={field.value}>
                      <SelectTrigger_Shadcn_>{field.value}</SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectGroup_Shadcn_>
                          <SelectItem_Shadcn_ value="BigQuery">BigQuery</SelectItem_Shadcn_>
                        </SelectGroup_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            ></FormField_Shadcn_>
            <FormField_Shadcn_
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>Name</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} placeholder="Name" />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>Project Id</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} placeholder="Project id" />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="datasetId"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>Dataset Id</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} placeholder="Dataset id" />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="serviceAccountKey"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>Service Account Key</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <TextArea_Shadcn_
                      {...field}
                      rows={4}
                      maxLength={5000}
                      placeholder="Service account key"
                    />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
            <Button ref={submitRef} htmlType="submit" type="default" className="hidden">
              Hidden form submit button
            </Button>
          </form>
        </Form_Shadcn_>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default NewDestinationPanel
