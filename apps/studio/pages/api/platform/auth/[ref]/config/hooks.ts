
import { apiBuilder } from 'lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  // FIXME: Implementation missing
  return res.status(200).json({
    hooks: {
      afterCreate: {
        uri: '',
        enabled: false,
        headers: {},
      },
      afterDelete: {
        uri: '',
        enabled: false,
        headers: {},
      },
      afterUpdate: {
        uri: '',
        enabled: false,
        headers: {},
      },
      afterAuthenticate: {
        uri: '',
        enabled: false,
        headers: {},
      },
      afterPasswordChange: {
        uri: '',
        enabled: false,
        headers: {},
      },
      afterEmailChange: {
        uri: '',
        enabled: false,
        headers: {},
      },
      afterPhoneChange: {
        uri: '',
        enabled: false,
        headers: {},
      },
      afterMFAChange: {
        uri: '',
        enabled: false,
        headers: {},
      }
    }
  })
}

const apiHandler = apiBuilder((builder) => 
  builder
    .useAuth()
    .patch(handlePatch)
)

export default apiHandler
