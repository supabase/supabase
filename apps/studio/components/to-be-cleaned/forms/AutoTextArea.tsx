import { TextAreaProps } from '@ui/components/Input/Input'
import { Input } from 'ui'

const AutoTextArea = (props: TextAreaProps) => {
  return (
    <div
      style={{
        minHeight: 'auto',
      }}
    >
      <Input.TextArea
        {...props}
        label={props.label}
        size="small"
        rows={1}
        style={{
          height: 'auto',
          overflow: 'hidden',
          resize: 'none',
        }}
        // onChange={onChangeHandler}
      />
    </div>
  )
}

export default AutoTextArea
