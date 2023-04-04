import { init, Tiktoken } from 'https://esm.sh/@dqbd/tiktoken@1.0.2/lite/init'
import { ChatCompletionRequestMessage } from 'https://esm.sh/v113/openai@3.2.1'

const encoderResponse = await fetch('https://esm.sh/@dqbd/tiktoken@1.0.2/encoders/cl100k_base.json')
const cl100kBase = await encoderResponse.json()

await init(async (imports) => {
  const req = await fetch('https://esm.sh/@dqbd/tiktoken/lite/tiktoken_bg.wasm')
  return WebAssembly.instantiate(await req.arrayBuffer(), imports)
})

export const tokenizer = new Tiktoken(
  cl100kBase.bpe_ranks,
  cl100kBase.special_tokens,
  cl100kBase.pat_str
)

/**
 * Count the tokens for multi-message chat completion requests
 *
 * See "6. Counting tokens for chat API calls"
 * from https://github.com/openai/openai-cookbook/blob/834181d5739740eb8380096dac7056c925578d9a/examples/How_to_count_tokens_with_tiktoken.ipynb
 */
export function numTokensFromMessages(
  messages: ChatCompletionRequestMessage[],
  model = 'gpt-3.5-turbo-0301'
): number {
  let tokensPerMessage: number
  let tokensPerName: number

  switch (model) {
    case 'gpt-3.5-turbo':
      console.warn(
        'Warning: gpt-3.5-turbo may change over time. Returning num tokens assuming gpt-3.5-turbo-0301.'
      )
      return numTokensFromMessages(messages, 'gpt-3.5-turbo-0301')
    case 'gpt-4':
      console.warn('Warning: gpt-4 may change over time. Returning num tokens assuming gpt-4-0314.')
      return numTokensFromMessages(messages, 'gpt-4-0314')
    case 'gpt-3.5-turbo-0301':
      tokensPerMessage = 4 // every message follows <|start|>{role/name}\n{content}<|end|>\n
      tokensPerName = -1 // if there's a name, the role is omitted
      break
    case 'gpt-4-0314':
      tokensPerMessage = 3
      tokensPerName = 1
      break
    default:
      throw new Error(
        `numTokensFromMessages() is not implemented for model ${model}. See https://github.com/openai/openai-python/blob/main/chatml.md for information on how messages are converted to tokens.`
      )
  }

  const numTokens = messages.reduce((acc, message) => {
    let tokens = acc + tokensPerMessage
    for (const [key, value] of Object.entries(message)) {
      tokens += tokenizer.encode(value).length
      if (key === 'name') {
        tokens += tokensPerName
      }
    }
    return tokens
  }, 0)

  return numTokens + 3 // every reply is primed with <|im_start|>assistant<|im_sep|>
}
