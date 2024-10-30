import { NextApiResponse } from 'next'

export default function handler(res: NextApiResponse) {
  if (process.env.OPENAI_API_KEY) {
    res.status(200).send('OK')
  } else {
    res.status(401).send('API key not found')
  }
}
