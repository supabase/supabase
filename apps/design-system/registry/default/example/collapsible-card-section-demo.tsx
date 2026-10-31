import { Input } from 'ui'
import { CollapsibleCardSection } from 'ui-patterns/CollapsibleCardSection'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export default function CollapsibleCardSectionDemo() {
  return (
    <div className="border rounded-lg px-6 py-4 w-full max-w-lg">
      <CollapsibleCardSection
        title="Advanced settings"
        description="These settings cannot be changed after creation"
      >
        <FormItemLayout
          isReactForm={false}
          layout="flex-row-reverse"
          label="OIDC Issuer"
          description="The OIDC issuer URL of your identity provider."
        >
          <Input placeholder="https://your-org.okta.com" />
        </FormItemLayout>
      </CollapsibleCardSection>
    </div>
  )
}
