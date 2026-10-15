import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, Form, FormControl, FormField } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { isValidProjectRef, ProjectSelector } from 'ui-patterns/ProjectSelector'
import { z } from 'zod'

const organizations = [
  { slug: 'acme', name: 'Acme Inc' },
  { slug: 'globex', name: 'Globex Corporation' },
]

const projects = [
  { ref: 'qwertyuiopasdfghjklz', name: 'Marketing site', organizationSlug: 'acme' },
  { ref: 'mnbvcxzlkjhgfdsapoiu', name: 'Billing API', organizationSlug: 'acme' },
  { ref: 'poiuytrewqlkjhgfdsam', name: 'Analytics', organizationSlug: 'globex' },
]

const FormSchema = z.object({
  projectRef: z
    .string()
    .min(1, 'Select a project')
    .refine(isValidProjectRef, 'Enter a valid project ref (20 lowercase letters)'),
})
type FormValues = z.infer<typeof FormSchema>

const defaultValues: FormValues = { projectRef: '' }

export default function ProjectSelectorForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  function onSubmit(values: FormValues) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form className="w-96 flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          name="projectRef"
          control={form.control}
          render={({ field }) => (
            <FormItemLayout label="Project" description="The project to connect to">
              <FormControl>
                <ProjectSelector
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  organizations={organizations}
                  projects={projects}
                />
              </FormControl>
            </FormItemLayout>
          )}
        />
        <Button size="small" variant="secondary" type="submit" className="self-start">
          Save
        </Button>
      </form>
    </Form>
  )
}
