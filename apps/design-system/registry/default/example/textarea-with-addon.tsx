import { InputGroup, InputGroupAddon, InputGroupText, InputGroupTextarea } from 'ui'

export default function TextareaWithAddon() {
  return (
    <InputGroup className="w-full max-w-sm">
      <InputGroupTextarea placeholder="Type your message here." rows={4} maxLength={120} />
      <InputGroupAddon align="block-end">
        <InputGroupText>120 character limit</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )
}
