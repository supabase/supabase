import { Code2, Palette, Save, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Button,
  cn,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Slider_Shadcn_,
  Switch,
  Textarea,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

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
  templates: FormSchema[]
  canUseRawSource: boolean
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

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const buildPreviewHtml = ({
  theme,
  blocks,
  content,
  subject,
}: {
  theme: EmailTheme
  blocks: EmailBlocks
  content: ReturnType<typeof getTemplateContent>
  subject: string
}) => {
  const textAlign = theme.alignment
  const year = new Date().getFullYear()
  const safeAppName = escapeHtml(SAMPLE_APP_NAME)
  const safeSubject = escapeHtml(subject)
  const safeHeading = escapeHtml(content.heading)
  const safeBody = escapeHtml(content.body)
  const safeHelper = escapeHtml(content.helper)
  const safeSafety = escapeHtml(content.safety)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:${theme.outerPadding}px 16px;background:${theme.pageBackground};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${theme.textColor};">
  <div style="max-width:${theme.contentWidth}px;margin:0 auto;background:${theme.bodyBackground};border:1px solid rgba(24,24,27,.08);border-radius:8px;overflow:hidden;">
    <div style="padding:32px 36px 12px;text-align:${textAlign};">
      ${
        blocks.appMark
          ? `<div style="width:32px;height:32px;border-radius:8px;background:${theme.accentColor};display:inline-block;margin-bottom:16px;"></div>`
          : ''
      }
      ${
        blocks.appName
          ? `<div style="font-size:13px;font-weight:600;color:${theme.textColor};margin-bottom:20px;">${safeAppName}</div>`
          : ''
      }
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${theme.accentColor};font-weight:700;margin-bottom:12px;">${escapeHtml(content.eyebrow)}</div>
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:${theme.textColor};font-weight:650;">${safeHeading}</h1>
      <p style="margin:0;font-size:15px;line-height:1.65;color:${theme.textColor};opacity:.78;">${safeBody}</p>
    </div>
    ${
      content.action
        ? `<div style="padding:18px 36px 8px;text-align:${textAlign};"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:${theme.accentColor};color:#ffffff;text-decoration:none;border-radius:6px;padding:11px 16px;font-size:14px;font-weight:600;">${escapeHtml(content.action)}</a></div>`
        : ''
    }
    <div style="padding:18px 36px 32px;text-align:${textAlign};">
      ${
        blocks.helper
          ? `<p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:${theme.textColor};opacity:.62;">${safeHelper}</p>`
          : ''
      }
      ${
        blocks.safety
          ? `<p style="margin:0;font-size:13px;line-height:1.55;color:${theme.textColor};opacity:.62;">${safeSafety}</p>`
          : ''
      }
    </div>
    ${
      blocks.copyright
        ? `<div style="border-top:1px solid rgba(24,24,27,.08);padding:18px 36px;text-align:${textAlign};font-size:12px;color:${theme.textColor};opacity:.48;">© ${year} ${safeAppName}</div>`
        : ''
    }
  </div>
  <span style="display:none!important;">${safeSubject}</span>
</body>
</html>`
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

const BlockToggle = ({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) => (
  <div className="flex items-start justify-between gap-3 rounded-md border px-3 py-3">
    <div className="space-y-1">
      <p className="text-sm text-foreground">{label}</p>
      <p className="text-xs leading-5 text-foreground-lighter">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
)

export const EmailTemplateBuilderPrototype = ({
  initialTemplate,
  templates,
  canUseRawSource,
}: EmailTemplateBuilderPrototypeProps) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplate.id ?? '')
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? initialTemplate
  const selectedContent = getTemplateContent(selectedTemplate)
  const subjectKey = getSubjectKey(selectedTemplate)
  const [subjects, setSubjects] = useState<Record<string, string>>(() => {
    return Object.fromEntries(
      templates.map((template) => {
        const content = getTemplateContent(template)
        return [template.id ?? template.title, content.subject]
      })
    )
  })
  const [blocks, setBlocks] = useState<Record<string, EmailBlocks>>(() => {
    return Object.fromEntries(
      templates.map((template) => [template.id ?? template.title, { ...DEFAULT_BLOCKS }])
    )
  })
  const [theme, setTheme] = useState<EmailTheme>(DEFAULT_THEME)

  const selectedBlocks = blocks[selectedTemplate.id ?? selectedTemplate.title] ?? DEFAULT_BLOCKS
  const selectedSubject = subjects[selectedTemplate.id ?? selectedTemplate.title] ?? ''
  const previewHtml = useMemo(
    () =>
      buildPreviewHtml({
        theme,
        blocks: selectedBlocks,
        content: selectedContent,
        subject: selectedSubject,
      }),
    [theme, selectedBlocks, selectedContent, selectedSubject]
  )

  const updateTheme = <Key extends keyof EmailTheme>(key: Key, value: EmailTheme[Key]) => {
    setTheme((current) => ({ ...current, [key]: value }))
  }

  const updateBlock = (key: keyof EmailBlocks, value: boolean) => {
    setBlocks((current) => ({
      ...current,
      [selectedTemplate.id ?? selectedTemplate.title]: {
        ...selectedBlocks,
        [key]: value,
      },
    }))
  }

  return (
    <div className="space-y-4">
      <Admonition
        type="default"
        title="Prototype only"
        description="This builder uses local state only. It does not save templates, call Platform, or change Auth configuration."
      />

      <div className="overflow-hidden rounded-md border bg-surface-100">
        <div className="grid min-h-[760px] grid-cols-1 xl:grid-cols-[300px_minmax(420px,1fr)_300px]">
          <aside className="border-b bg-surface-75 p-4 xl:border-b-0 xl:border-r">
            <div className="mb-5 flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-foreground-lighter" />
              <div>
                <h2 className="text-sm text-foreground">Template</h2>
                <p className="text-xs text-foreground-lighter">Content controls are local here.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <FieldLabel label="Current template" />
                <Select_Shadcn_ value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger_Shadcn_>
                    <SelectValue_Shadcn_ placeholder="Select template" />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {templates.map((template) => (
                      <SelectItem_Shadcn_ key={template.id} value={template.id ?? template.title}>
                        {template.title}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>

              <div className="space-y-2">
                <FieldLabel label="Subject" value={subjectKey} />
                <Input_Shadcn_
                  value={selectedSubject}
                  onChange={(event) =>
                    setSubjects((current) => ({
                      ...current,
                      [selectedTemplate.id ?? selectedTemplate.title]: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <FieldLabel label="Template copy" />
                <Textarea value={selectedContent.body} readOnly rows={5} className="resize-none" />
                <p className="text-xs leading-5 text-foreground-lighter">
                  Future versions could expose safe phrases here without opening raw HTML.
                </p>
              </div>

              <div className="space-y-3">
                <FieldLabel label="Safe blocks" />
                <BlockToggle
                  label="App name"
                  description="{{> app_name}}"
                  checked={selectedBlocks.appName}
                  onCheckedChange={(checked) => updateBlock('appName', checked)}
                />
                <BlockToggle
                  label="Compact app mark"
                  description="{{> app_logo}} placeholder"
                  checked={selectedBlocks.appMark}
                  onCheckedChange={(checked) => updateBlock('appMark', checked)}
                />
                <BlockToggle
                  label="Secondary helper"
                  description="Context below the main action"
                  checked={selectedBlocks.helper}
                  onCheckedChange={(checked) => updateBlock('helper', checked)}
                />
                <BlockToggle
                  label="Ignore this email"
                  description="Safety copy for unexpected mail"
                  checked={selectedBlocks.safety}
                  onCheckedChange={(checked) => updateBlock('safety', checked)}
                />
                <BlockToggle
                  label="Copyright"
                  description="© {{current_year}} {{app.name}}"
                  checked={selectedBlocks.copyright}
                  onCheckedChange={(checked) => updateBlock('copyright', checked)}
                />
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
                  Save disabled
                </Button>
                <Button type="default" icon={<Code2 size={14} />} disabled={!canUseRawSource}>
                  Raw source
                </Button>
              </div>
            </div>
            <div
              className="flex flex-1 items-start justify-center overflow-auto p-4 lg:p-8"
              style={{ background: theme.pageBackground }}
            >
              <iframe
                title={`${selectedTemplate.title} branded email preview`}
                srcDoc={previewHtml}
                sandbox=""
                className="h-[620px] w-full rounded-md border bg-white shadow-sm"
                style={{ maxWidth: theme.contentWidth + theme.outerPadding * 2 }}
              />
            </div>
            <div className="border-t px-5 py-3 text-xs text-foreground-lighter">
              Raw mode remains the escape hatch for eligible projects; this prototype keeps it
              visible without making it the main path.
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
