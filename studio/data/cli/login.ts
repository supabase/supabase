import { post } from 'data/fetchers'

export async function createCliLoginSession(
  sessionId: string,
  publicKey: string,
  tokenName?: string
) {
  if (!sessionId) {
    throw new Error('sessionId is required')
  }

  const { data } = await post(`/platform/cli/login`, {
    body: {
      session_id: sessionId,
      public_key: publicKey,
      token_name: tokenName,
    },
  })

  return data
}
