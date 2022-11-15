import { Input } from 'ui'

export type DNSRecordProps = {
  type: string
  name: string
  value: string
  showLabel?: boolean
}

const DNSRecord = ({ type, name, value, showLabel = false }: DNSRecordProps) => {
  return (
    <div className="flex gap-4">
      <Input
        readOnly
        disabled
        label={showLabel ? 'Type' : ''}
        className="input-mono"
        value={type.toUpperCase()}
        layout="vertical"
      />
      <Input
        readOnly
        copy
        disabled
        label={showLabel ? 'Name' : ''}
        className="input-mono flex-1"
        value={name}
        layout="vertical"
      />
      <Input
        readOnly
        copy
        disabled
        label={showLabel ? 'Value' : ''}
        className="input-mono flex-1"
        value={value}
        layout="vertical"
      />
    </div>
  )
}

export default DNSRecord
