import { Input_Shadcn_, Label_Shadcn_ } from 'ui'

export default function InputFile() {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label_Shadcn_ htmlFor="picture">Picture</Label_Shadcn_>
      <Input_Shadcn_ id="picture" type="file" />
    </div>
  )
}
