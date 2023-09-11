import { useParams } from 'common'
import { FormPanel, FormSection, FormSectionContent } from 'components/ui/Forms'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { CustomOpenIdUrls } from './CustomOpenIdUrls'

export const CustomJwtUrlsForm = () => {
  const { ref: projectRef } = useParams()
  const { data: postgrestConfig, isLoading } = useProjectPostgrestConfigQuery({
    projectRef,
  })

  return (
    <div className="mb-8">
      <FormPanel header="Custom OpenID URLs">
        <FormSection>
          <FormSectionContent loading={isLoading} fullWidth>
            <CustomOpenIdUrls postgrestConfig={postgrestConfig} />
          </FormSectionContent>
        </FormSection>
      </FormPanel>
    </div>
  )
}
