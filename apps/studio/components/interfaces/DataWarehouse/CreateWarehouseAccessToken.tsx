import { useState } from 'react'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Modal,
} from 'ui'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

type CreateWarehouseProps = {
  onSubmit: (values: { description: string }) => void
  loading: boolean
  open: boolean
  setOpen: (open: boolean) => void
}

const CreateWarehouseAccessToken = ({ onSubmit, loading, open, setOpen }: CreateWarehouseProps) => {
  const FormSchema = z.object({
    description: z.string().min(1, {
      message: 'Description is required',
    }),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      description: '',
    },
  })

  return (
    <>
      <Button type="outline" onClick={() => setOpen(true)}>
        Create access token
      </Button>
      <Modal
        size="medium"
        onCancel={() => {
          setOpen(false)
        }}
        header="Create access token"
        visible={open}
        alignFooter="right"
        loading={loading}
      >
        <Modal.Content className="py-4">
          <Form_Shadcn_ {...form}>
            <form
              id="create-access-token-form"
              onSubmit={form.handleSubmit((data) => onSubmit(data))}
            >
              <FormField_Shadcn_
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem_Shadcn_>
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ type="text" {...field} />
                    </FormControl_Shadcn_>
                  </FormItem_Shadcn_>
                )}
              />
            </form>
          </Form_Shadcn_>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default CreateWarehouseAccessToken
