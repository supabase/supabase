import type { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, Input } from 'ui'
import { CollapsibleCardSection } from 'ui-patterns/CollapsibleCardSection'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { SSOConfigFormSchema } from './SSOConfig'

export const SSOAdvancedSettings = ({ form }: { form: UseFormReturn<SSOConfigFormSchema> }) => (
  <CollapsibleCardSection
    title="Advanced settings"
    description="Required for enterprise-managed MCP authentication"
  >
    <FormField
      control={form.control}
      name="idjagIssuerUrl"
      render={({ field }) => (
        <FormItemLayout
          layout="flex-row-reverse"
          label="IDJAG Issuer"
          description="The IDJAG issuer URL of your identity provider."
        >
          <FormControl>
            <Input placeholder="https://your-org.okta.com" {...field} />
          </FormControl>
        </FormItemLayout>
      )}
    />
  </CollapsibleCardSection>
)
