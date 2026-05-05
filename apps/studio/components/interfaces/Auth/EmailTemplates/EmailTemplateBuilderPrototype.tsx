import { Code2, Palette, RotateCcw, Save, SlidersHorizontal, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button, cn, Input_Shadcn_, Slider_Shadcn_ } from 'ui'

import type { FormSchema } from '@/types'

type Alignment = 'left' | 'center'

type EmailTheme = {
  pageBackground: string
  bodyBackground: string
  textColor: string
  accentColor: string
  alignment: Alignment
  outerPadding: number
  contentWidth: number
}

type EmailBlocks = {
  appName: boolean
  appMark: boolean
  copyright: boolean
  helper: boolean
  safety: boolean
}

interface EmailTemplateBuilderPrototypeProps {
  initialTemplate: FormSchema
}

const DEFAULT_THEME: EmailTheme = {
  pageBackground: '#f4f4f5',
  bodyBackground: '#ffffff',
  textColor: '#18181b',
  accentColor: '#18181b',
  alignment: 'left',
  outerPadding: 32,
  contentWidth: 560,
}

const DEFAULT_BLOCKS: EmailBlocks = {
  appName: true,
  appMark: false,
  copyright: true,
  helper: true,
  safety: true,
}

const SAMPLE_APP_NAME = 'Acme Studio'

const TEMPLATE_CONTENT: Record<
  string,
  {
    subject: string
    eyebrow: string
    heading: string
    body: string
    action?: string
    helper: string
    safety: string
  }
> = {
  CONFIRMATION: {
    subject: 'Confirm your email address',
    eyebrow: 'Confirm sign up',
    heading: 'Confirm your email address',
    body: 'Finish creating your account by confirming this email address.',
    action: 'Confirm email address',
    helper: 'This link expires shortly and can only be used once.',
    safety: 'If you did not create an account, you can safely ignore this email.',
  },
  INVITE: {
    subject: 'You have been invited',
    eyebrow: 'Invite user',
    heading: 'You have been invited to join',
    body: 'Accept the invitation to create your account and join this project.',
    action: 'Accept invitation',
    helper: 'The invitation is tied to this email address.',
    safety: 'If you were not expecting this invitation, you can ignore this email.',
  },
  MAGIC_LINK: {
    subject: 'Your sign-in link',
    eyebrow: 'Magic link',
    heading: 'Sign in to your account',
    body: 'Use this one-time link to sign in without a password.',
    action: 'Sign in',
    helper: 'This link expires shortly and can only be used once.',
    safety: 'If you did not request this link, you can safely ignore this email.',
  },
  EMAIL_CHANGE: {
    subject: 'Confirm your new email address',
    eyebrow: 'Change email address',
    heading: 'Confirm your new email address',
    body: 'Confirm this email address to finish updating your account.',
    action: 'Confirm new email',
    helper: 'The update is not complete until this address is confirmed.',
    safety: 'If you did not request this change, keep using your current email address.',
  },
  RECOVERY: {
    subject: 'Reset your password',
    eyebrow: 'Reset password',
    heading: 'Reset your password',
    body: 'Use this link to choose a new password for your account.',
    action: 'Reset password',
    helper: 'This link expires shortly for your account security.',
    safety: 'If you did not request a password reset, you can safely ignore this email.',
  },
  REAUTHENTICATION: {
    subject: 'Your verification code',
    eyebrow: 'Reauthentication',
    heading: 'Verify it is you',
    body: 'Enter this code to continue with your account action.',
    action: '{{ .Token }}',
    helper: 'This code expires shortly and can only be used once.',
    safety: 'If you did not request this code, you can safely ignore this email.',
  },
  PASSWORD_CHANGED_NOTIFICATION: {
    subject: 'Your password was changed',
    eyebrow: 'Security notification',
    heading: 'Your password was changed',
    body: 'The password for your account was changed.',
    helper: 'Review your account if this change was unexpected.',
    safety: 'If this was not you, reset your password and contact support.',
  },
  EMAIL_CHANGED_NOTIFICATION: {
    subject: 'Your email address was changed',
    eyebrow: 'Security notification',
    heading: 'Your email address was changed',
    body: 'The email address for your account was changed.',
    helper: 'Review your account settings if this change was unexpected.',
    safety: 'If this was not you, contact support.',
  },
  PHONE_CHANGED_NOTIFICATION: {
    subject: 'Your phone number was changed',
    eyebrow: 'Security notification',
    heading: 'Your phone number was changed',
    body: 'The phone number for your account was changed.',
    helper: 'Review your account settings if this change was unexpected.',
    safety: 'If this was not you, contact support.',
  },
  IDENTITY_LINKED_NOTIFICATION: {
    subject: 'A new identity was linked',
    eyebrow: 'Security notification',
    heading: 'A new identity was linked',
    body: 'A new sign-in method was linked to your account.',
    helper: 'Review your connected identities if this was unexpected.',
    safety: 'If this was not you, contact support.',
  },
  IDENTITY_UNLINKED_NOTIFICATION: {
    subject: 'An identity was unlinked',
    eyebrow: 'Security notification',
    heading: 'An identity was unlinked',
    body: 'A sign-in method was removed from your account.',
    helper: 'Review your connected identities if this was unexpected.',
    safety: 'If this was not you, contact support.',
  },
  MFA_FACTOR_ENROLLED_NOTIFICATION: {
    subject: 'A multi-factor method was added',
    eyebrow: 'Security notification',
    heading: 'A multi-factor method was added',
    body: 'A new multi-factor authentication method was added to your account.',
    helper: 'Review your security settings if this was unexpected.',
    safety: 'If this was not you, contact support.',
  },
  MFA_FACTOR_UNENROLLED_NOTIFICATION: {
    subject: 'A multi-factor method was removed',
    eyebrow: 'Security notification',
    heading: 'A multi-factor method was removed',
    body: 'A multi-factor authentication method was removed from your account.',
    helper: 'Review your security settings if this was unexpected.',
    safety: 'If this was not you, contact support.',
  },
}

const getTemplateContent = (template: FormSchema) => {
  return TEMPLATE_CONTENT[template.id ?? ''] ?? TEMPLATE_CONTENT.CONFIRMATION
}

const getSubjectKey = (template: FormSchema) =>
  Object.keys(template.properties).find((key) => key.startsWith('MAILER_SUBJECTS_'))

const FieldLabel = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex items-center justify-between gap-3">
    <label className="text-xs text-foreground-light">{label}</label>
    {value && <span className="text-xs text-foreground-lighter">{value}</span>}
  </div>
)

const ColorField = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) => (
  <div className="space-y-2">
    <FieldLabel label={label} value={value} />
    <div className="flex items-center gap-2">
      <Input_Shadcn_
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-12 shrink-0 p-1"
      />
      <Input_Shadcn_ value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  </div>
)

const BLOCK_LABELS: Record<keyof EmailBlocks, string> = {
  appName: 'App name',
  appMark: 'Compact app mark',
  copyright: 'Copyright',
  helper: 'Secondary helper',
  safety: 'Ignore this email',
}

const EditablePreviewBlock = ({
  label,
  children,
  onRemove,
}: {
  label: string
  children: ReactNode
  onRemove: () => void
}) => (
  <div className="group relative rounded-md border border-transparent transition-colors hover:border-border-strong">
    <div>{children}</div>
    <Button
      type="default"
      size="tiny"
      icon={<X size={12} />}
      className="absolute right-2 top-2 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100"
      onClick={onRemove}
    >
      Remove {label}
    </Button>
  </div>
)

export const EmailTemplateBuilderPrototype = ({
  initialTemplate,
}: EmailTemplateBuilderPrototypeProps) => {
  const selectedTemplate = initialTemplate
  const selectedContent = getTemplateContent(selectedTemplate)
  const subjectKey = getSubjectKey(selectedTemplate)
  const [subject, setSubject] = useState(selectedContent.subject)
  const [blocks, setBlocks] = useState<EmailBlocks>(DEFAULT_BLOCKS)
  const [theme, setTheme] = useState<EmailTheme>(DEFAULT_THEME)
  const hiddenBlocks = (Object.keys(blocks) as Array<keyof EmailBlocks>).filter(
    (key) => !blocks[key]
  )

  const updateTheme = <Key extends keyof EmailTheme>(key: Key, value: EmailTheme[Key]) => {
    setTheme((current) => ({ ...current, [key]: value }))
  }

  const updateBlock = (key: keyof EmailBlocks, value: boolean) => {
    setBlocks((current) => ({ ...current, [key]: value }))
  }

  const textAlign = theme.alignment
  const year = new Date().getFullYear()

  return (
    <div>
      <div className="overflow-hidden rounded-md border bg-surface-100">
        <div className="grid min-h-[760px] grid-cols-1 xl:grid-cols-[300px_minmax(420px,1fr)_300px]">
          <aside className="border-b bg-surface-75 p-4 xl:border-b-0 xl:border-r">
            <div className="mb-5 flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-foreground-lighter" />
              <div>
                <h2 className="text-sm text-foreground">Template</h2>
                <p className="text-xs text-foreground-lighter">
                  Edit safe content blocks for this template.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-md border bg-surface-100 p-3">
                <p className="text-sm text-foreground">{selectedTemplate.title}</p>
                {selectedTemplate.purpose && (
                  <p className="mt-1 text-xs leading-5 text-foreground-lighter">
                    {selectedTemplate.purpose}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabel label="Subject" value={subjectKey} />
                <Input_Shadcn_
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel label="Available blocks" />
                {hiddenBlocks.length === 0 ? (
                  <p className="rounded-md border bg-surface-100 p-3 text-xs leading-5 text-foreground-lighter">
                    Hover over optional content in the preview to remove it.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {hiddenBlocks.map((key) => (
                      <Button
                        key={key}
                        type="default"
                        size="tiny"
                        icon={<RotateCcw size={12} />}
                        onClick={() => updateBlock(key, true)}
                      >
                        {BLOCK_LABELS[key]}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>

          <main className="flex min-w-0 flex-col border-b xl:border-b-0">
            <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm text-foreground">Preview</h2>
                <p className="text-xs text-foreground-lighter">
                  Generated from safe theme values and controlled content blocks.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="default" icon={<Save size={14} />} disabled>
                  Save changes
                </Button>
                <Button type="default" icon={<Code2 size={14} />} disabled>
                  Source locked
                </Button>
              </div>
            </div>
            <div
              className="flex flex-1 items-start justify-center overflow-auto p-4 lg:p-8"
              style={{ background: theme.pageBackground }}
            >
              <div
                className="w-full"
                style={{ maxWidth: theme.contentWidth + theme.outerPadding * 2 }}
              >
                <div
                  className="rounded-md border bg-white p-4 shadow-sm"
                  style={{ background: theme.pageBackground }}
                >
                  <div
                    className="mx-auto overflow-hidden rounded-lg border"
                    style={{
                      maxWidth: theme.contentWidth,
                      background: theme.bodyBackground,
                      color: theme.textColor,
                    }}
                  >
                    <div className="space-y-3 px-9 pb-3 pt-8" style={{ textAlign }}>
                      {blocks.appMark && (
                        <EditablePreviewBlock
                          label="compact app mark"
                          onRemove={() => updateBlock('appMark', false)}
                        >
                          <div
                            className="mb-4 inline-block h-8 w-8 rounded-lg"
                            style={{ background: theme.accentColor }}
                          />
                        </EditablePreviewBlock>
                      )}
                      {blocks.appName && (
                        <EditablePreviewBlock
                          label="app name"
                          onRemove={() => updateBlock('appName', false)}
                        >
                          <div className="mb-5 text-[13px] font-medium">{SAMPLE_APP_NAME}</div>
                        </EditablePreviewBlock>
                      )}
                      <div
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: theme.accentColor }}
                      >
                        {selectedContent.eyebrow}
                      </div>
                      <h1 className="m-0 text-2xl font-semibold leading-tight">
                        {selectedContent.heading}
                      </h1>
                      <p className="m-0 text-[15px] leading-relaxed opacity-80">
                        {selectedContent.body}
                      </p>
                    </div>

                    {selectedContent.action && (
                      <div className="px-9 pb-2 pt-4" style={{ textAlign }}>
                        <span
                          className="inline-block rounded-md px-4 py-2.5 text-sm font-medium text-white"
                          style={{ background: theme.accentColor }}
                        >
                          {selectedContent.action}
                        </span>
                      </div>
                    )}

                    <div className="space-y-3 px-9 pb-8 pt-5" style={{ textAlign }}>
                      {blocks.helper && (
                        <EditablePreviewBlock
                          label="secondary helper"
                          onRemove={() => updateBlock('helper', false)}
                        >
                          <p className="m-0 text-[13px] leading-relaxed opacity-60">
                            {selectedContent.helper}
                          </p>
                        </EditablePreviewBlock>
                      )}
                      {blocks.safety && (
                        <EditablePreviewBlock
                          label="ignore this email copy"
                          onRemove={() => updateBlock('safety', false)}
                        >
                          <p className="m-0 text-[13px] leading-relaxed opacity-60">
                            {selectedContent.safety}
                          </p>
                        </EditablePreviewBlock>
                      )}
                    </div>

                    {blocks.copyright && (
                      <EditablePreviewBlock
                        label="copyright"
                        onRemove={() => updateBlock('copyright', false)}
                      >
                        <div
                          className="border-t px-9 py-4 text-xs opacity-50"
                          style={{ textAlign }}
                        >
                          © {year} {SAMPLE_APP_NAME}
                        </div>
                      </EditablePreviewBlock>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t px-5 py-3 text-xs text-foreground-lighter">
              Raw source editing is unavailable while this project uses Supabase's built-in email
              service.
            </div>
          </main>

          <aside className="bg-surface-75 p-4 xl:border-l">
            <div className="mb-5 flex items-center gap-2">
              <Palette size={16} className="text-foreground-lighter" />
              <div>
                <h2 className="text-sm text-foreground">Edit theme</h2>
                <p className="text-xs text-foreground-lighter">
                  Applies to all Auth email templates.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <ColorField
                label="Page background"
                value={theme.pageBackground}
                onChange={(value) => updateTheme('pageBackground', value)}
              />
              <ColorField
                label="Body background"
                value={theme.bodyBackground}
                onChange={(value) => updateTheme('bodyBackground', value)}
              />
              <ColorField
                label="Text colour"
                value={theme.textColor}
                onChange={(value) => updateTheme('textColor', value)}
              />
              <ColorField
                label="Link/button colour"
                value={theme.accentColor}
                onChange={(value) => updateTheme('accentColor', value)}
              />

              <div className="space-y-2">
                <FieldLabel label="Body alignment" />
                <div className="grid grid-cols-2 gap-2">
                  {(['left', 'center'] as const).map((alignment) => (
                    <Button
                      key={alignment}
                      type={theme.alignment === alignment ? 'default' : 'outline'}
                      className={cn(theme.alignment === alignment && 'border-stronger')}
                      onClick={() => updateTheme('alignment', alignment)}
                    >
                      {alignment === 'left' ? 'Left' : 'Centre'}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <FieldLabel label="Outer padding" value={`${theme.outerPadding}px`} />
                <Slider_Shadcn_
                  min={16}
                  max={64}
                  step={4}
                  value={[theme.outerPadding]}
                  onValueChange={([value]) => updateTheme('outerPadding', value ?? 32)}
                />
              </div>

              <div className="space-y-3">
                <FieldLabel label="Content width" value={`${theme.contentWidth}px`} />
                <Slider_Shadcn_
                  min={480}
                  max={640}
                  step={20}
                  value={[theme.contentWidth]}
                  onValueChange={([value]) => updateTheme('contentWidth', value ?? 560)}
                />
              </div>

              <div className="rounded-md border bg-surface-100 p-3">
                <h3 className="text-sm text-foreground">Global CSS</h3>
                <p className="mt-1 text-xs leading-5 text-foreground-lighter">
                  Represented as named controls in this prototype. No arbitrary selectors or raw CSS
                  are accepted.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
