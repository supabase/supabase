import { Badge, Dropdown, IconChevronDown } from 'ui'
import { useRouter } from 'next/router'
import { REFERENCES } from './Navigation/NavigationMenu/NavigationMenu.constants'

const RevVersionDropdown = () => {
  const { asPath, push } = useRouter()
  const pathSegments = asPath.split('/')

  const library = pathSegments.length >= 3 ? pathSegments[2] : undefined
  const libraryMeta = REFERENCES?.[library] ?? undefined
  const versions = libraryMeta?.versions ?? []

  const currentVersion = versions.includes(pathSegments[pathSegments.indexOf(library) + 1])
    ? pathSegments[pathSegments.indexOf(library) + 1]
    : versions[0]

  const onSelectVersion = (version: string) => {
    if (!library) return
    if (version === versions[0]) {
      push(`/reference/${library}/start`)
    } else {
      push(`/reference/${library}/${version}/start`)
    }
  }

  if (!versions || versions.length === 0) {
    return <></>
  }

  return (
    <Dropdown
      size="small"
      align="start"
      side="bottom"
      overlay={
        <>
          <Dropdown.Label>Stable releases</Dropdown.Label>
          {versions.map((version, index) => (
            <Dropdown.Item key={version} onClick={() => onSelectVersion(version)}>
              <span className={`${currentVersion === version ? 'font-bold' : ''}`}>
                Version {version}.0
              </span>
              <Dropdown.RightSlot>
                {index === 0 && <Badge size="small">Latest</Badge>}
              </Dropdown.RightSlot>
            </Dropdown.Item>
          ))}
        </>
      }
    >
      <div
        className="
          group
          justify-between
          bg-scaleA-200
          border
          hover:border-scale-600
          hover:bg-scaleA-300
          border-scale-500 px-2 h-[32px] rounded
          font-mono
          flex items-center gap-1 text-scale-900 text-xs group-hover:text-scale-1200 transition
          "
      >
        {/* <span>version</span> */}
        <span className="text-scale-1200 text-sm group-hover:text-scale-1200 transition">
          {currentVersion}.0
        </span>
        <IconChevronDown size={14} strokeWidth={2} />
      </div>
    </Dropdown>
  )
}
export default RevVersionDropdown
