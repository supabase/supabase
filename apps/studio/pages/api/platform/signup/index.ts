import { apiBuilder } from 'lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'
import { VELA_PLATFORM_GOTRUE_URL } from '../../constants'

interface SignupRequestUi {
  email: string
  password: string
  hcaptchaToken: string
  redirectTo: string
}

interface SignupRequestAuth {
  email: string
  password: string
  phone?: string
  data?: { [key: string]: any }
  channel?: string
  code_challenge_method: string
  code_challenge: string
}

interface SignupResponseAuth {
  id: string
  aud: string
  role: string
  email: string
  phone: string
  confirmation_sent_at: string
  app_metadata: {
    provider: string
    providers: string[]
  }
  user_metadata: {
    email: string
    email_verified: boolean
    phone_verified: boolean
    sub: string
  }
  identities: {
    identity_id: string
    id: string
    user_id: string
    identity_data: {
      email: string
      email_verified: boolean
      phone_verified: boolean
      sub: string
    }
    provider: string
    last_sign_in_at: string
    created_at: string
    updated_at: string
    email: string
  }[]
  created_at: string
  updated_at: string
  is_anonymous: boolean
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const request = req.body as SignupRequestUi
  const goTrueRequest: SignupRequestAuth = {
    email: request.email,
    password: request.password,
    code_challenge_method: '',
    code_challenge: '',
  }

  const response = await fetch(`${VELA_PLATFORM_GOTRUE_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(goTrueRequest),
  })

  if (response.status !== 200) {
    return res.status(response.status).send(response.body)
  }

  const data = await response.json() as SignupResponseAuth
  console.log(JSON.stringify(data, null, 2))
  return res.status(200).json(data)
}

const apiHandler = apiBuilder((builder) => builder.post(handlePost))

export default apiHandler
