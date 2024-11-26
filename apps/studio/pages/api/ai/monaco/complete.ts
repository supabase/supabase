import { generateText } from 'ai'
import { NextApiRequest, NextApiResponse } from 'next'
import { openai } from '@ai-sdk/openai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      completion: null,
      error: `Method ${req.method} Not Allowed`,
    })
  }

  try {
    const { completionMetadata } = req.body
    const { textBeforeCursor, textAfterCursor, language } = completionMetadata

    const prompt = `Please complete the following ${language} code:
      ${textBeforeCursor}
      <cursor>
      ${textAfterCursor}
      
      Use modern ${language} practices. Provide only the completed code without comments or explanations.`

    const completion = await generateText({
      model: openai('gpt-4'),
      messages: [
        {
          role: 'system',
          content: 'You are an expert programmer who provides concise code completions.',
        },
        { role: 'user', content: prompt },
      ],
    })

    return res.status(200).json({ completion })
  } catch (error) {
    console.error('Completion error:', error)
    return res.status(500).json({
      completion: null,
      error: 'Failed to generate completion',
    })
  }
}
