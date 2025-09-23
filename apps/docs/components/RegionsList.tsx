import { AWS_REGIONS } from 'shared-data'

export function RegionsList() {
  return (
    <ul>
      {Object.keys(AWS_REGIONS).map((region) => (
        <li key={region} className="flex flex-col gap-2">
          <span className="w-fit !mt-0">{AWS_REGIONS[region].displayName}</span>
          <code className="w-fit">{AWS_REGIONS[region].code}</code>
        </li>
      ))}
    </ul>
  )
}
