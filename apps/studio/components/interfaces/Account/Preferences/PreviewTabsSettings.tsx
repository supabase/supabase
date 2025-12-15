import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { useTabsStateSnapshot } from 'state/tabs'
import { Card, CardContent, FormControl_Shadcn_, FormField_Shadcn_, Form_Shadcn_, Switch } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

const PreviewTabsSchema = z.object({
  previewTabsEnabled: z.boolean(),
})

export const PreviewTabsSettings = () => {
  const tabs = useTabsStateSnapshot()

  const form = useForm<z.infer<typeof PreviewTabsSchema>>({
    resolver: zodResolver(PreviewTabsSchema),
    values: {
      previewTabsEnabled: tabs.previewTabsEnabled,
    },
  })

  const handleToggle = (value: boolean) => {
    tabs.togglePreviewTabs()
    form.setValue('previewTabsEnabled', value)
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle id="preview-tabs">Editor Tabs</PageSectionTitle>
          <PageSectionDescription>
            Configure how tabs behave in the SQL and Table editors.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Form_Shadcn_ {...form}>
          <Card>
            <CardContent>
              <FormField_Shadcn_
                control={form.control}
                name="previewTabsEnabled"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Preview tabs"
                    description="When enabled, single-clicking items in the sidebar opens them in a temporary preview tab. Double-click or edit to make them permanent. When disabled, all tabs open as permanent tabs immediately."
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          handleToggle(value)
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </CardContent>
          </Card>
        </Form_Shadcn_>
      </PageSectionContent>
    </PageSection>
  )
}
