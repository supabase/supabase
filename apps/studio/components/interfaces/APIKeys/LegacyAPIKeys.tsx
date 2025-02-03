import { FormHeader } from 'components/ui/Forms/FormHeader'
import DisplayApiSettings from 'components/ui/ProjectSettings/DisplayApiSettings'

const LegacyAPIKeys = () => {
  return (
    <div>
      <FormHeader
        title="Legacy API keys"
        description="Legacy, JWT-based API keys. Support for these is ending in October 2025. Prefer Publishable and Secret API keys instead."
      />
      <DisplayApiSettings legacy showNotice={false} />
    </div>
  )
  return
}

export default LegacyAPIKeys
