import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ref } = req.query
  console.log('the ref is', ref) // says ref is undefined

  // Check if ref is provided
  if (!ref) {
    return res.status(400).end('Bad Request: Missing or invalid project reference.')
  }

  try {
    // call Slack webhook
    // const response = await fetch('YOUR_SLACK_WEBHOOK_URL', { method: 'POST', body: JSON.stringify({ text: `Post: ${ref}` }) });
    // if (!response.ok) throw new Error('Failed to send to Slack');

    res.status(200).end(`Thank you! We have received your report.`)
  } catch (error) {
    const errorMessage = (error as Error).message
    res.status(500).end(`Failure: Could not send post to Slack. Error: ${errorMessage}`)
  }
}
