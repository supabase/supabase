import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { NextApiRequest, NextApiResponse } from 'next'

export const maxDuration = 30
const openAiKey = process.env.OPENAI_API_KEY

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!openAiKey) {
    return res.status(500).json({
      completion: null,
      error: 'No OPENAI_API_KEY set. Create this environment variable to use AI features.',
    })
  }

  console.log('complete req.body', req.body)

  if (req.method !== 'POST') {
    return res.status(405).json({
      completion: null,
      error: `Method ${req.method} Not Allowed`,
    })
  }

  try {
    const { completionMetadata } = req.body
    const { textBeforeCursor, textAfterCursor, language, prompt, selection } = completionMetadata

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      maxSteps: 5,
      system: `You are an expert programmer who provides concise code completions.
        When writing code:
        - Use modern ${language} practices and patterns
        - Provide only the completed code without markdown, or explanations
        - Don't wrap in markdown code snippet e.g. DONT DO \`\`\`sql ... \`\`\`
        - Ensure code is properly formatted and follows best practices
        - Only modify and return the selected text. It must work when inserted inbetween the before and after text.
        - Add comments to explain the code if needed
        - Consider the context before and after the cursor to provide relevant completions`,
      messages: [
        {
          role: 'user',
          content: `I have the following ${language} code:
            before selection: ${textBeforeCursor}
            selection: ${selection}
            after selection: ${textAfterCursor}
           Make these changes to the selected text: ${prompt}
            Assume I will replace the selected text and insert between the before and after text.`,
        },
      ],
    })

    return res.status(200).json({ completion: text })
  } catch (error) {
    console.error('Completion error:', error)
    return res.status(500).json({
      completion: null,
      error: 'Failed to generate completion',
    })
  }
}
