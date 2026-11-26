import { Input } from 'ui-patterns/DataInputs/Input'

import { useTrack } from '@/lib/telemetry/track'

export type DNSRecordProps = {
  type: 'CNAME' | 'TXT'
  name: string
  value: string
}

export const DNSRecord = ({ type, name, value }: DNSRecordProps) => {
  const track = useTrack()

  return (
    <div className="flex gap-4 items-center">
      <div className="w-[50px]">
        <p className="font-mono text-base">{type.toUpperCase()}</p>
      </div>

      <Input
        readOnly
        copy
        containerClassName="flex-1"
        className="font-mono"
        value={name}
        onCopy={() => track('custom_domain_dns_record_copied', { recordType: type, field: 'name' })}
      />
      <Input
        readOnly
        copy
        containerClassName="flex-1"
        className="font-mono"
        value={value}
        onCopy={() =>
          track('custom_domain_dns_record_copied', { recordType: type, field: 'value' })
        }
      />
    </div>
  )
}
