import { Settings, Plus, Save, UserPlus, Database, Key, Trash } from 'lucide-react'
import { Button, CardFooter } from 'ui'
import { Page, PageContent, PageSection } from 'ui-patterns/Page'
import { FormFieldWrapper } from 'ui-patterns/form/FormFieldWrapper'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Form_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormControl_Shadcn_,
  FormMessage_Shadcn_,
  FormDescription_Shadcn_,
  Switch,
  Input_Shadcn_,
  TextArea_Shadcn_,
} from 'ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Admonition } from 'ui-patterns/admonition'

const formSchema = z.object({
  isPublic: z.boolean().default(false),
  projectName: z.string().min(2, {
    message: 'Project name must be at least 2 characters.',
  }),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function PageDemo() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isPublic: false,
      projectName: '',
      description: '',
    },
  })

  function onSubmit(data: FormValues) {
    console.log(data)
  }

  return (
    <div className="bg w-full">
      <Page
        // isCompact
        size="small"
        title="Project Settings"
        subtitle="Manage your project settings and configurations"
        className="bg-red"
        // icon={<Settings size={24} />}
        breadcrumbs={[
          { label: 'Projects', href: '#projects' },
          { label: 'Example Project', href: '#example-project' },
          { label: 'Settings' },
        ]}
        primaryActions={
          <Button icon={<Plus size={16} />} size="small">
            Create new
          </Button>
        }
        navigation={{
          items: [
            {
              id: 'general',
              label: 'General',
              href: '#general',
              icon: <Database size={16} />,
            },
            {
              id: 'team',
              label: 'Team Members',
              href: '#team',
              icon: <UserPlus size={16} />,
            },
            {
              id: 'api',
              label: 'API Keys',
              href: '#api',
              icon: <Key size={16} />,
            },
          ],
        }}
      >
        <PageContent size="small" className="pb-16">
          <PageSection
            title="General Settings"
            subtitle="Basic configuration options for your project"
          >
            <Form_Shadcn_ {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Sub Section</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormFieldWrapper
                      control={form.control}
                      name="isPublic"
                      label="Public Project"
                      description="Allow this project to be viewed by anyone with the link."
                      orientation="horizontal"
                    >
                      {(field) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                    </FormFieldWrapper>
                  </CardContent>
                  <CardContent>
                    <FormField_Shadcn_
                      control={form.control}
                      name="projectName"
                      render={({ field }) => (
                        <FormItem_Shadcn_ className="grid grid-cols-12 gap-8 items-center">
                          <div className="col-span-6">
                            <FormLabel_Shadcn_>Project Name</FormLabel_Shadcn_>
                            <FormDescription_Shadcn_ className="text-xs">
                              This is the name that will be displayed for your project.
                            </FormDescription_Shadcn_>
                          </div>
                          <div className="col-span-6">
                            <FormControl_Shadcn_>
                              <Input_Shadcn_ {...field} placeholder="Enter project name" />
                            </FormControl_Shadcn_>
                            <FormMessage_Shadcn_ />
                          </div>
                        </FormItem_Shadcn_>
                      )}
                    />
                  </CardContent>
                  <CardContent>
                    <FormField_Shadcn_
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <>
                          <FormItem_Shadcn_ className="grid grid-cols-12 gap-8 items-start opacity-25">
                            <div className="col-span-6">
                              <FormLabel_Shadcn_>Description</FormLabel_Shadcn_>
                              <FormDescription_Shadcn_ className="text-xs">
                                A brief description of your project.
                              </FormDescription_Shadcn_>
                            </div>
                            <div className="col-span-6">
                              <FormControl_Shadcn_>
                                <TextArea_Shadcn_
                                  {...field}
                                  placeholder="Enter project description"
                                  rows={3}
                                />
                              </FormControl_Shadcn_>
                              <FormMessage_Shadcn_ className="text-right" />
                            </div>
                          </FormItem_Shadcn_>
                          <Admonition
                            className="mt-4"
                            type="note"
                            title={'Upgrade to pro'}
                            description={
                              'Upgrade your plan to gain access to this wonderful feature'
                            }
                          >
                            <Button type="outline" className="mt-2">
                              Upgrade plan
                            </Button>
                          </Admonition>
                        </>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button type="outline">Cancel</Button>
                    <Button>Deploy</Button>
                  </CardFooter>
                </Card>
              </form>
            </Form_Shadcn_>
          </PageSection>

          <PageSection title="Project status">
            <Card>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Restart project</p>
                  <p className="text-xs text-foreground-light">
                    Your project will not be available for a few minutes.
                  </p>
                </div>
                <Button type="outline">Restart project</Button>
              </CardContent>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Pause project</p>
                  <p className="text-xs text-foreground-light">
                    Your project will not be accessible while it is paused.
                  </p>
                </div>
                <Button type="outline">Pause project</Button>
              </CardContent>
            </Card>
          </PageSection>
        </PageContent>
      </Page>
    </div>
  )
}
