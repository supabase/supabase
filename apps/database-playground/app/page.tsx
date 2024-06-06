'use client'

import { executeJS } from 'ai-sandbox'
import { useChat } from 'ai/react'
import { useMemo, useState } from 'react'

export default function Page() {
  const [buttonClasses, setButtonClasses] = useState('')
  const functionBindings = useMemo(() => {
    return {
      setButtonClasses: {
        description: 'Sets the tailwind classes for the button on the screen',
        typeDef: '(className: string): void',
        fn: (className: string) => setButtonClasses(className),
      },
    }
  }, [])

  const expose = useMemo(() => {
    return Object.entries(functionBindings).reduce(
      (merged, [name, { fn }]) => ({
        ...merged,
        [name]: fn,
      }),
      {}
    )
  }, [functionBindings])

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: 'api/plan',
    body: {
      functionBindings,
    },
    maxToolRoundtrips: 5,
    async onToolCall({ toolCall }) {
      console.log('tool', toolCall)
      if (toolCall.toolName === 'interpret') {
        const args: any = toolCall.args
        const { exports, error } = await executeJS(args.source, {
          expose,
        })

        const result = error ?? exports

        return result
      }
    },
  })

  return (
    <>
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.content}
          {message.toolInvocations &&
            message.toolInvocations.map((invocation) => (
              <div key={invocation.toolCallId}>{invocation.args.source}</div>
            ))}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input name="prompt" value={input} onChange={handleInputChange} id="input" />
        <button className={buttonClasses} type="submit">
          Submit
        </button>
      </form>
    </>
  )
}
