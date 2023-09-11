import { FormHeader } from 'components/ui/Forms'

import JWTSettings from '../JWTSettings'
import { CustomJwksForm } from './CustomJwksForm'

const ForeignJWTSettings = () => {
  return (
    <>
      <section>
        <div className="flex items-center justify-between">
          <FormHeader
            title="JWT Settings"
            description="You can manage your own JWT key and add keys from 3rd party services."
          />
        </div>
        <JWTSettings />
        <CustomJwksForm />
      </section>
    </>
  )
}

export default ForeignJWTSettings
