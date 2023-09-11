import { FormPanel } from 'components/ui/Forms'
import { CustomJwksInput } from './CustomJwksInput'

export const CustomJwksForm = () => {
  return (
    <div className="mb-8">
      <FormPanel header="Custom JWKS JSON">
        <CustomJwksInput />
      </FormPanel>
    </div>
  )
}
