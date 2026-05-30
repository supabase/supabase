import { useState } from 'react'
import { ExpandingTextArea } from 'ui'

export default function ExpandingTextareaDemo() {
  const [value, setValue] = useState('')

  return (
    <ExpandingTextArea
      placeholder="Type your message in multiple lines here."
      value={value}
      onChange={(event) => {
        setValue(event.target.value)
      }}
    />
  )
}
