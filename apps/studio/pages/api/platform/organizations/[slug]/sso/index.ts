import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from '../../../../../../lib/api/apiBuilder'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    enabled: false,
    domains: [],
    metadata_xml_url: '',
    metadata_xml_file: '',
    email_mapping: [],
    user_name_mapping: [],
    first_name_mapping: [],
    last_name_mapping: [],
    join_org_on_signup: false,
    role_on_join: 'Administrator',
  })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    id: '',
    sso_provider: {
      id: '',
      name: '',
      metadata_url: '',
      entity_id: '',
      metadata_xml: '',
      attribute_mapping: {
        keys: [],
      },
    },
    domains: [],
    attribute_mapping: {
      email: [],
      username: [],
      first_name: [],
      last_name: [],
    },
    access_control: {
      join_org_on_signup: false,
      role_on_join: '',
    },
  })
}

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    id: '',
    sso_provider: {
      id: '',
      name: '',
      metadata_url: '',
      entity_id: '',
      metadata_xml: '',
      attribute_mapping: {
        keys: [],
      },
    },
    domains: [],
    attribute_mapping: {
      email: [],
      username: [],
      first_name: [],
      last_name: [],
    },
    access_control: {
      join_org_on_signup: false,
      role_on_join: '',
    },
  })
}

const apiHandler = apiBuilder((builder) =>
  builder.useAuth().get(handleGet).post(handlePost).put(handlePut)
)

export default apiHandler
