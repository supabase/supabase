import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from '../../../../../lib/api/apiBuilder'
import { IS_VELA_PLATFORM } from 'lib/constants'
import { GOTRUE_URL } from '../../../constants'

interface InviteRequest {
  orgSlug?: string
  projectRef: string
  email: string
}

interface InviteResponse {
  id: string
  invited_email: string
  invited_at: string
  role_id: number
}

interface goTrueInviteRequest {
  email: string
}

interface goTrueInviteResponse {
  id: string
  email: string
  confirmation_sent_at: string
  created_at: string
  updated_at: string
  invited_at: string
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!IS_VELA_PLATFORM) {
    return res
      .status(400)
      .json({ error: { message: 'This endpoint is only available on Vela Platform' } })
  }

  const request = req.body as InviteRequest
  const inviteRequest: goTrueInviteRequest = {
    email: request.email,
  }

  const response = await fetch(`${GOTRUE_URL}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(inviteRequest),
  })

  if (response.status !== 200) {
    return res.status(response.status).send(response.body)
  }

  const data = (await response.json()) as goTrueInviteResponse
  console.log(JSON.stringify(data, null, 2))
  return res.status(200).json({
    id: data.id,
    invited_at: data.invited_at,
    invited_email: data.email,
    role_id: 0, // FIXME don't know the role id
  } as InviteResponse)
}

const apiHandler = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default apiHandler
