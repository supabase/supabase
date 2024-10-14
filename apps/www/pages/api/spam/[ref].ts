import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ref } = req.query
  const { reason } = req.body

  if (!ref) {
    return res.status(400).end('Bad Request: Missing or invalid project reference.')
  }

  const refString = typeof ref !== 'string'
  const refPattern = /^[a-zA-Z]{20}$/
  const refIsInvalid = !refString && !refPattern.test(ref)

  if (refIsInvalid) {
    return res.status(400).end('Bad Request: Missing or invalid project reference.')
  }

  try {
    const response = await fetch(process.env.EMAIL_REPORT_SLACK_WEBHOOK as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `New report from: ${ref} \n\n ${reason}` }),
    })

    if (!response.ok) throw new Error('Failed to send to Slack')

    res.status(200).end(`Thank you! We have received your report.`)
  } catch (error) {
    const errorMessage = (error as Error).message
    res.status(500).end(`Failure: Could not send post to Slack. Error: ${errorMessage}`)
  }
}
