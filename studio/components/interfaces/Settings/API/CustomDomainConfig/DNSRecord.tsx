import { Input } from 'ui'

export type DNSRecordProps = {
  type: string
  name: string
  value: string
}

const DNSRecord = ({ type, name, value }: DNSRecordProps) => {
  return (
    <div className="flex gap-4">
      <Input
        label="Type"
        readOnly
        disabled
        className="input-mono"
        value={type.toUpperCase()}
        layout="vertical"
      />
      <Input
        label="Name"
        readOnly
        copy
        disabled
        className="input-mono flex-1"
        value={name}
        layout="vertical"
      />
      <Input
        label="Value"
        readOnly
        copy
        disabled
        className="input-mono flex-1"
        value={value}
        layout="vertical"
      />
    </div>
  )
}

export default DNSRecord
