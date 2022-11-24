import specFile from '~/../../spec/storage_v0_openapi.json' assert { type: 'json' }
import { gen_v3 } from '~/lib/refGenerator/helpers'

// @ts-ignore
const specGen = gen_v3(specFile, 'wat', { apiUrl: 'apiv0' })

console.log({ specGen })

export default function Ref(props) {
  console.log({ specFile })
  return (
    <div>
      <div className="flex my-16">hay?</div>
    </div>
  )
}
