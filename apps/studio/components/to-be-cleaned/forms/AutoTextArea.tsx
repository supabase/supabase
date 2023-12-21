import { TextAreaProps } from '@ui/components/Input/Input'
import { useRef, useState } from 'react'
import { Input } from 'ui'

const AutoTextArea = (props: TextAreaProps) => {
  const textAreaRef = useRef(null)
  const [text, setText] = useState('')
  const [textAreaHeight, setTextAreaHeight] = useState('auto')
  const [parentHeight, setParentHeight] = useState('auto')

  // useEffect(() => {
  //   setParentHeight(`${textAreaRef?.current.scrollHeight}px`)
  //   setTextAreaHeight(`${textAreaRef?.current.scrollHeight}px`)
  // }, [text])

  // const onChangeHandler = (event) => {
  //   setTextAreaHeight('auto')
  //   setParentHeight(`${textAreaRef?.current.scrollHeight}px`)
  //   setText(event.target.value)

  //   if (props.onChange) {
  //     props.onChange(event)
  //   }
  // }

  return (
    <div
      style={{
        minHeight: parentHeight,
      }}
    >
      <Input.TextArea
        {...props}
        label={props.label}
        size="small"
        // ref={textAreaRef}
        rows={1}
        style={{
          height: textAreaHeight,
          overflow: 'hidden',
          resize: 'none',
        }}
        // onChange={onChangeHandler}
      />
    </div>
  )
}

export default AutoTextArea
