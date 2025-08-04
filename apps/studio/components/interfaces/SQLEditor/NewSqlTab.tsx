import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

import { useParams } from 'common'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { useContentInsertMutation } from 'data/content/content-insert-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useProfile } from 'lib/profile'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input,
} from 'ui'

const FormSchema = z.object({
  name: z.string().min(1, { message: 'Please enter a name for the snippet' }),
  sql: z.string().optional(),
})

export const NewSqlTab = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { profile } = useProfile()
  const project = useSelectedProject()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      sql: '',
    },
  })

  // Extract content parameter from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const content = urlParams.get('content')
    if (content) {
      form.setValue('sql', content)
    }
  }, [form])

  const { mutate: insertContent, isLoading } = useContentInsertMutation({
    onSuccess: (data) => {
      toast.success('Snippet created successfully!')
      // Redirect to the new snippet
      router.push(`/project/default/sql/${data.id}`)
    },
    onError: (error) => {
      toast.error(`Failed to create snippet: ${error.message}`)
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = (values) => {
    if (!ref || !profile?.id || !project?.id) {
      toast.error('Missing required information')
      return
    }

    const snippetId = uuidv4()

    insertContent({
      projectRef: ref,
      payload: {
        id: snippetId,
        name: values.name.trim(),
        description: '',
        owner_id: profile.id,
        type: 'sql',
        visibility: 'user',
        content: {
          content_id: snippetId,
          sql: values.sql || '',
          schema_version: '1.0',
          favorite: false,
        },
      },
    })
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Create New Snippet</h1>
          <p className="text-foreground-light">
            Create a new SQL snippet to save and share your queries
          </p>
        </div>

        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField_Shadcn_
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>Snippet Name</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <Input placeholder="Enter a name for your snippet" {...field} />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <FormField_Shadcn_
              control={form.control}
              name="sql"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>SQL Code</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="border border-default rounded-md overflow-hidden">
                      <CodeEditor
                        id="sql-editor"
                        language="pgsql"
                        className="h-64"
                        value={field.value || ''}
                        onInputChange={(value) => field.onChange(value || '')}
                      />
                    </div>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <div className="flex justify-center">
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                disabled={isLoading}
                size="medium"
              >
                Create Snippet
              </Button>
            </div>
          </form>
        </Form_Shadcn_>
      </div>
    </div>
  )
}
