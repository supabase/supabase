import { Message } from '@/lib/types'
import { CheckIcon } from 'lucide-react'
import { useState } from 'react'
import { Input, cn } from 'ui'

export const Chat = ({
  messages,
  loading,
  selected,
  onSelect,
  onSubmit,
  className,
}: {
  messages: Message[]
  loading: boolean
  selected: string | undefined
  onSelect: (m: string) => void
  onSubmit: (s: string) => void
  className?: string
}) => {
  const [value, setValue] = useState('')

  return (
    <div className={cn('flex flex-col px-2 mx-2 border-l border-r py-5', className)}>
      <div className="grow gap-2 flex flex-col mb-4">
        {messages.map((m) => {
          if (m.role === 'user') {
            return (
              <div key={m.id} className="bg-gray-500 p-4 w-3/4 rounded-lg">
                {m.text}
              </div>
            )
          }
          if (m.sql === '') {
            return null
          }
          return (
            <div
              key={m.id}
              className="bg-blue-500 p-4 w-3/4 rounded-lg self-end cursor-pointer border border-blue-500 hover:border-white flex flex-row justify-between"
              onClick={() => onSelect(m.id)}
            >
              AI answer
              {selected === m.id && (
                <div className="bg-white text-black rounded">
                  <CheckIcon strokeWidth={3} />
                </div>
              )}
            </div>
          )
        })}
        {loading && (
          <div
            key="loading"
            className="bg-blue-500 p-4 w-3/4 rounded-lg self-end cursor-pointer border border-blue-500 hover:border-white flex flex-row justify-between"
          >
            ...
          </div>
        )}
      </div>
      <div>
        <Input
          value={value}
          onChange={(v) => setValue(v.target.value)}
          onKeyDown={(e) => {
            if (e.code === 'Enter') {
              onSubmit(value)
            }
          }}
        />
      </div>
    </div>
  )
}
