import { expect } from '@jest/globals'
import { codeBlock } from 'common-tags'
import { createOpenAiClient } from '../src/openai'

const { openai, model, error } = createOpenAiClient()

if (error) {
  throw error
}

expect.extend({
  async toMatchCriteria(received: string, criteria: string) {
    const completionResponse = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: codeBlock`
            You are a test runner. Your job is to evaluate whether 'Received' adheres to the test 'Criteria'.
            
            You must output JSON, specifically an object containing a "pass" boolean and "reason" string:
            - \`{ "pass": true, "reason": "<reason>" }\` if 'Received' adheres to the test 'Criteria'
            - \`{ "pass": false, "reason": "<reason>" }\` if 'Received' does not adhere to the test 'Criteria'

            Be critical and make sure every part of 'Criteria' is addressed in 'Received'.
            The "reason" must explain exactly which part of 'Received' did or did not pass the test 'Criteria'.
            Be detailed as to why you failed the test.
          `,
        },
        {
          role: 'user',
          content: codeBlock`
            Received:
            ${received}

            Criteria:
            ${criteria}
          `,
        },
      ],
      max_tokens: 256,
      temperature: 0,
      response_format: {
        type: 'json_object',
      },
      stream: false,
    })

    const [choice] = completionResponse.choices

    if (!choice.message.content) {
      throw new Error('LLM evaluator returned invalid response')
    }

    const { pass, reason }: { pass?: boolean; reason?: string } = JSON.parse(choice.message.content)

    if (pass === undefined) {
      throw new Error('LLM evaluator returned invalid response')
    }

    return {
      message: () =>
        codeBlock`
          ${this.utils.matcherHint('toMatchCriteria', received, criteria, {
            comment: `evaluated by LLM '${model}'`,
            isNot: this.isNot,
            promise: this.promise,
          })}
          
          ${reason}
        `,
      pass,
    }
  },
})
