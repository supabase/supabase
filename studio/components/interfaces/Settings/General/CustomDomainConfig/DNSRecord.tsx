import { Input } from 'ui'

export type DNSRecordProps = {
  type: string
  name: string
  value: string
}

const DNSRecord = ({ type, name, value }: DNSRecordProps) => {
  return (
    <div className="flex gap-4 items-center">
      <div className="w-[50px]">
        <p className="font-mono text-base">{type.toUpperCase()}</p>
      </div>
      <Input readOnly copy disabled className="input-mono flex-1" value={name} layout="vertical" />
      <Input readOnly copy disabled className="input-mono flex-1" value={value} layout="vertical" />
    </div>
  )
}

export default DNSRecord
