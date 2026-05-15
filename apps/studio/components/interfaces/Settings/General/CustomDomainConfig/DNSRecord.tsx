import { Input } from 'ui-patterns/DataInputs/Input'

export type DNSRecordProps = {
  type: string
  name: string
  value: string
}

export const DNSRecord = ({ type, name, value }: DNSRecordProps) => {
  return (
    <div className="flex gap-4 items-center">
      <div className="w-[50px]">
        <p className="font-mono text-base">{type.toUpperCase()}</p>
      </div>

      <Input readOnly copy containerClassName="flex-1" className="font-mono" value={name} />
      <Input readOnly copy containerClassName="flex-1" className="font-mono" value={value} />
    </div>
  )
}

export default DNSRecord
