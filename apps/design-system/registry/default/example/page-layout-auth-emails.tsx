'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardFooter,
  Form,
  FormControl,
  FormField,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  NavMenu,
  NavMenuItem,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { PageBreadcrumbs } from 'ui-patterns/PageBreadcrumbs'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageNav } from 'ui-patterns/PageNav'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import * as z from 'zod'

type SubPageId = 'templates' | 'smtp'

const subPages: { id: SubPageId; label: string }[] = [
  { id: 'templates', label: 'Templates' },
  { id: 'smtp', label: 'SMTP Settings' },
]

const AUTHENTICATION_TEMPLATES = [
  {
    title: 'Confirm signup',
    purpose: 'Ask users to confirm their email address after signing up',
  },
  {
    title: 'Invite user',
    purpose: 'Invite users who do not yet have an account to join your application',
  },
  {
    title: 'Magic link',
    purpose: 'Allow users to sign in via a one-time link sent to their email',
  },
  {
    title: 'Change email address',
    purpose: 'Ask users to verify their new email address after changing it',
  },
  {
    title: 'Reset password',
    purpose: 'Allow users to reset their password if they forget it',
  },
]

const SECURITY_TEMPLATES = [
  {
    id: 'PASSWORD_CHANGED',
    title: 'Password changed',
    purpose: 'Notify users when their password has been changed',
    enabled: true,
  },
  {
    id: 'EMAIL_CHANGED',
    title: 'Email address changed',
    purpose: 'Notify users when their email address has been changed',
    enabled: true,
  },
  {
    id: 'PHONE_CHANGED',
    title: 'Phone number changed',
    purpose: 'Notify users when their phone number has been changed',
    enabled: false,
  },
]

const NotificationsFormSchema = z.object({
  MAILER_NOTIFICATIONS_PASSWORD_CHANGED_ENABLED: z.boolean(),
  MAILER_NOTIFICATIONS_EMAIL_CHANGED_ENABLED: z.boolean(),
  MAILER_NOTIFICATIONS_PHONE_CHANGED_ENABLED: z.boolean(),
})

const SmtpFormSchema = z.object({
  ENABLE_SMTP: z.boolean(),
  SMTP_ADMIN_EMAIL: z.string().optional(),
  SMTP_SENDER_NAME: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_MAX_FREQUENCY: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
})

export default function PageLayoutAuthEmails() {
  const [activePage, setActivePage] = useState<SubPageId>('templates')

  return (
    <div className="w-full">
      <PageBreadcrumbs>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/project/demo/auth">Authentication</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Emails</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageBreadcrumbs>

      <PageNav>
        <NavMenu>
          {subPages.map((page) => (
            <NavMenuItem key={page.id} active={activePage === page.id}>
              <button
                type="button"
                aria-pressed={activePage === page.id}
                className="h-full cursor-pointer appearance-none bg-transparent text-inherit"
                onClick={() => setActivePage(page.id)}
              >
                {page.label}
              </button>
            </NavMenuItem>
          ))}
        </NavMenu>
      </PageNav>

      {activePage === 'templates' && (
        <TemplatesPage onNavigateToSmtp={() => setActivePage('smtp')} />
      )}
      {activePage === 'smtp' && <SmtpPage />}
    </div>
  )
}

function TemplatesPage({ onNavigateToSmtp }: { onNavigateToSmtp: () => void }) {
  const notificationsForm = useForm<z.infer<typeof NotificationsFormSchema>>({
    resolver: zodResolver(NotificationsFormSchema),
    defaultValues: {
      MAILER_NOTIFICATIONS_PASSWORD_CHANGED_ENABLED: true,
      MAILER_NOTIFICATIONS_EMAIL_CHANGED_ENABLED: true,
      MAILER_NOTIFICATIONS_PHONE_CHANGED_ENABLED: false,
    },
  })

  const handleSave = (values: z.infer<typeof NotificationsFormSchema>) => {
    notificationsForm.reset(values)
    notificationsForm.clearErrors()
  }

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Templates</PageHeaderTitle>
            <PageHeaderDescription>
              Configure what emails your users receive and how they are sent
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="small" className="pb-16">
        <PageSection>
          <Admonition
            type="warning"
            title="Set up custom SMTP"
            description="You're using the built-in email service. This service has rate limits and is not meant to be used for production apps."
            layout="horizontal"
            className="mb-4"
            actions={
              <Button type="default" size="tiny" onClick={onNavigateToSmtp}>
                Set up SMTP
              </Button>
            }
          />

          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Authentication</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <Card>
              {AUTHENTICATION_TEMPLATES.map((template) => (
                <CardContent key={template.title} className="p-0">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-surface-200"
                  >
                    <div className="flex flex-col">
                      <h3 className="text-sm text-foreground">{template.title}</h3>
                      <p className="text-sm text-foreground-lighter">{template.purpose}</p>
                    </div>
                    <ChevronRight size={16} className="text-foreground-muted" />
                  </button>
                </CardContent>
              ))}
            </Card>
          </PageSectionContent>
        </PageSection>

        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Security</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <Form {...notificationsForm}>
              <form className="space-y-4" onSubmit={notificationsForm.handleSubmit(handleSave)}>
                <Card>
                  {SECURITY_TEMPLATES.map((template) => {
                    const fieldName =
                      `MAILER_NOTIFICATIONS_${template.id}_ENABLED` as keyof z.infer<
                        typeof NotificationsFormSchema
                      >

                    return (
                      <CardContent
                        key={template.id}
                        className="flex h-full w-full items-center justify-between p-0 transition-colors hover:bg-surface-200"
                      >
                        <button type="button" className="flex flex-1 flex-col px-6 py-4 text-left">
                          <h3 className="text-sm text-foreground">{template.title}</h3>
                          <p className="text-sm text-foreground-lighter">{template.purpose}</p>
                        </button>

                        <div className="relative flex h-full items-center gap-4 pl-2">
                          <FormField
                            control={notificationsForm.control}
                            name={fieldName}
                            render={({ field }) => (
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            )}
                          />
                          <button type="button" className="py-6 pr-6" aria-label="Edit template">
                            <ChevronRight size={16} className="text-foreground-muted" />
                          </button>
                        </div>
                      </CardContent>
                    )
                  })}
                  <CardFooter className="justify-end space-x-2">
                    {notificationsForm.formState.isDirty && (
                      <Button type="default" onClick={() => notificationsForm.reset()}>
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="primary"
                      htmlType="submit"
                      disabled={!notificationsForm.formState.isDirty}
                    >
                      Save changes
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

function SmtpPage() {
  const form = useForm<z.infer<typeof SmtpFormSchema>>({
    resolver: zodResolver(SmtpFormSchema),
    defaultValues: {
      ENABLE_SMTP: false,
      SMTP_ADMIN_EMAIL: '',
      SMTP_SENDER_NAME: '',
      SMTP_HOST: '',
      SMTP_PORT: undefined,
      SMTP_MAX_FREQUENCY: 60,
      SMTP_USER: '',
    },
  })
  const enableSmtp = form.watch('ENABLE_SMTP')

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>SMTP Settings</PageHeaderTitle>
            <PageHeaderDescription>
              Configure a custom SMTP provider for sending authentication and security emails
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="small">
        <PageSection>
          <PageSectionContent>
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(() => undefined)}>
                <Card>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="ENABLE_SMTP"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="flex-row-reverse"
                          label="Enable custom SMTP"
                          description="Emails will be sent using your custom SMTP provider. Email rate limits can be adjusted in rate limits settings."
                        >
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItemLayout>
                      )}
                    />

                    {enableSmtp && (
                      <Admonition
                        type="warning"
                        title="All fields must be filled"
                        description="Each of the fields below must be filled before custom SMTP can be enabled."
                        className="mt-4 border-warning-400 bg-warning-200"
                      />
                    )}
                  </CardContent>

                  {enableSmtp && (
                    <>
                      <CardContent className="py-6">
                        <div className="grid grid-cols-12 gap-6">
                          <div className="col-span-4">
                            <h3 className="mb-1 text-sm">Sender details</h3>
                            <p className="text-balance text-sm text-foreground-lighter">
                              Configure the sender information for your emails.
                            </p>
                          </div>
                          <div className="col-span-8 space-y-4">
                            <FormField
                              control={form.control}
                              name="SMTP_ADMIN_EMAIL"
                              render={({ field }) => (
                                <FormItemLayout
                                  label="Sender email address"
                                  description="The email address the emails are sent from."
                                >
                                  <FormControl>
                                    <Input {...field} placeholder="noreply@yourdomain.com" />
                                  </FormControl>
                                </FormItemLayout>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="SMTP_SENDER_NAME"
                              render={({ field }) => (
                                <FormItemLayout
                                  label="Sender name"
                                  description="Name displayed in the recipient's inbox."
                                >
                                  <FormControl>
                                    <Input {...field} placeholder="Your App" />
                                  </FormControl>
                                </FormItemLayout>
                              )}
                            />
                          </div>
                        </div>
                      </CardContent>

                      <CardContent className="py-6">
                        <div className="grid grid-cols-12 gap-6">
                          <div className="col-span-4">
                            <h3 className="mb-1 text-sm">SMTP provider settings</h3>
                            <p className="text-balance text-sm text-foreground-lighter">
                              Your SMTP credentials will always be encrypted in our database.
                            </p>
                          </div>
                          <div className="col-span-8 space-y-4">
                            <FormField
                              control={form.control}
                              name="SMTP_HOST"
                              render={({ field }) => (
                                <FormItemLayout
                                  label="Host"
                                  description="Hostname or IP address of your SMTP server."
                                >
                                  <FormControl>
                                    <Input {...field} placeholder="smtp.yourdomain.com" />
                                  </FormControl>
                                </FormItemLayout>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="SMTP_PORT"
                              render={({ field }) => (
                                <FormItemLayout
                                  label="Port number"
                                  description="Port used by your SMTP server. Common ports include 465 and 587."
                                >
                                  <FormControl>
                                    <Input
                                      type="number"
                                      value={field.value ?? ''}
                                      onChange={(event) => field.onChange(event.target.value)}
                                      placeholder="587"
                                    />
                                  </FormControl>
                                </FormItemLayout>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="SMTP_MAX_FREQUENCY"
                              render={({ field }) => (
                                <FormItemLayout
                                  label="Minimum interval per user"
                                  description="The minimum time in seconds between emails before another email can be sent to the same user."
                                >
                                  <FormControl>
                                    <InputGroup>
                                      <InputGroupInput
                                        type="number"
                                        value={field.value ?? ''}
                                        onChange={(event) => field.onChange(event.target.value)}
                                      />
                                      <InputGroupAddon align="inline-end">
                                        <InputGroupText>seconds</InputGroupText>
                                      </InputGroupAddon>
                                    </InputGroup>
                                  </FormControl>
                                </FormItemLayout>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="SMTP_USER"
                              render={({ field }) => (
                                <FormItemLayout
                                  label="Username"
                                  description="Username for your SMTP server."
                                >
                                  <FormControl>
                                    <Input {...field} placeholder="SMTP Username" />
                                  </FormControl>
                                </FormItemLayout>
                              )}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </>
                  )}

                  <CardFooter className="justify-end space-x-2">
                    {form.formState.isDirty && (
                      <Button type="default" onClick={() => form.reset()}>
                        Cancel
                      </Button>
                    )}
                    <Button type="primary" htmlType="submit" disabled={!form.formState.isDirty}>
                      Save changes
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
