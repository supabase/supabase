import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import type { editor } from 'monaco-editor'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button, CardContent, CardFooter, Label_Shadcn_ } from 'ui'
import { Admonition } from 'ui-patterns'

import { PreventNavigationOnUnsavedChanges } from '@/components/ui-patterns/Dialogs/PreventNavigationOnUnsavedChanges'
import CodeEditor from '@/components/ui/CodeEditor/CodeEditor'
import TwoOptionToggle from '@/components/ui/TwoOptionToggle'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

type LayoutConfigKey = 'MAILER_CONTENT_HEADER' | 'MAILER_CONTENT_FOOTER'

interface EmailLayoutEditorProps {
  configKey: LayoutConfigKey
}

export const EmailLayoutEditor = ({ configKey }: EmailLayoutEditorProps) => {
  const { ref: projectRef } = useParams()
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )
  const editorRef = useRef<editor.IStandaloneCodeEditor>()

  const { data: authConfig } = useAuthConfigQuery({ projectRef })

  const { mutate: updateAuthConfig, isPending: isSaving } = useAuthConfigUpdateMutation({
    onError: (error) => {
      toast.error(`Failed to update email layout: ${error.message}`)
    },
    onSuccess: () => {
      toast.success('Successfully updated email layout')
    },
  })

  const initialValue = ((authConfig as Record<string, unknown>)?.[configKey] as string) ?? ''

  const [bodyValue, setBodyValue] = useState(initialValue)
  const [activeView, setActiveView] = useState<'source' | 'preview'>('source')

  const hasChanges = bodyValue !== initialValue

  const previewValue = useMemo(() => {
    const c = authConfig as Record<string, unknown>
    return bodyValue
      .replace(/\{\{\s*\.SenderName\s*\}\}/g, (c?.MAILER_SENDER_NAME as string) ?? '')
      .replace(/\{\{\s*\.BrandLogoURL\s*\}\}/g, (c?.MAILER_BRAND_LOGO_URL as string) ?? '')
      .replace(/\{\{\s*\.ContentHeader\s*\}\}/g, (c?.MAILER_CONTENT_HEADER as string) ?? '')
      .replace(/\{\{\s*\.ContentFooter\s*\}\}/g, (c?.MAILER_CONTENT_FOOTER as string) ?? '')
  }, [bodyValue, authConfig])

  useEffect(() => {
    if (authConfig) {
      setBodyValue(((authConfig as Record<string, unknown>)[configKey] as string) ?? '')
    }
  }, [authConfig, configKey])

  const onSave = () => {
    if (!projectRef) return
    updateAuthConfig({ projectRef, config: { [configKey]: bodyValue } as never })
  }

  return (
    <>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <Label_Shadcn_>Body</Label_Shadcn_>
          <TwoOptionToggle
            width={60}
            options={['preview', 'source']}
            activeOption={activeView}
            onClickOption={(option: 'source' | 'preview') => setActiveView(option)}
            borderOverride="border-muted"
          />
        </div>
        {activeView === 'source' ? (
          <div className="overflow-hidden rounded-md border dark:border-control [&_.monaco-editor]:outline-0 [&_.monaco-editor-background]:!bg-surface-200/30 [&_.monaco-editor_.margin]:!bg-surface-200/30 dark:[&_.monaco-editor-background]:!bg-surface-300 dark:[&_.monaco-editor_.margin]:!bg-surface-300">
            <CodeEditor
              id={`layout-editor-${configKey}`}
              language="html"
              isReadOnly={!canUpdateConfig}
              className="!mb-0 relative h-96 outline-none outline-offset-0 outline-width-0 outline-0"
              onInputChange={(e: string | undefined) => setBodyValue(e ?? '')}
              options={{ wordWrap: 'on', contextmenu: false, padding: { top: 16 } }}
              value={bodyValue}
              editorRef={editorRef}
            />
          </div>
        ) : (
          <>
            <iframe
              className="!mb-0 mt-0 h-96 w-full overflow-hidden rounded-md border bg-white"
              title={configKey}
              srcDoc={previewValue}
              sandbox="allow-scripts allow-forms"
            />
            <Admonition
              type="default"
              title="Email rendering may differ"
              description="The preview shown here may differ slightly from how your email appears in the recipient's email client."
            />
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-row justify-end gap-2">
        {hasChanges && (
          <Button type="default" onClick={() => setBodyValue(initialValue)}>
            Cancel
          </Button>
        )}
        <Button
          type="primary"
          disabled={!canUpdateConfig || isSaving || !hasChanges}
          loading={isSaving}
          onClick={onSave}
        >
          Save changes
        </Button>
      </CardFooter>

      <PreventNavigationOnUnsavedChanges hasChanges={hasChanges} />
    </>
  )
}
