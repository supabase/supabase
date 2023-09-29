import { useRouter } from 'next/router'
import {
  Badge,
  DropdownMenuContent_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuLabel_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconChevronDown,
} from 'ui'
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
    <DropdownMenu_Shadcn_>
      <DropdownMenuTrigger_Shadcn_>
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
      </DropdownMenuTrigger_Shadcn_>
      <DropdownMenuContent_Shadcn_ align="start" side="bottom" className="w-48">
        <DropdownMenuLabel_Shadcn_ className="text-xs">Stable releases</DropdownMenuLabel_Shadcn_>
        {versions.map((version, index) => (
          <DropdownMenuItem_Shadcn_
            key={version}
            onClick={() => onSelectVersion(version)}
            className="justify-between flex"
          >
            <span className={`${currentVersion === version ? 'font-bold' : ''}`}>
              Version {version}.0
            </span>
            {index === 0 && <Badge size="small">Latest</Badge>}
          </DropdownMenuItem_Shadcn_>
        ))}
      </DropdownMenuContent_Shadcn_>
    </DropdownMenu_Shadcn_>
  )
}
export default RevVersionDropdown
