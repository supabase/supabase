import { useRouter } from 'next/router'
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div
          className="
          group
          justify-between
          bg-control
          border
          hover:border-control
          hover:bg-overlay-hover
          border-control px-2 h-[32px] rounded
          font-mono
          flex items-center gap-1 text-foreground-muted text-xs group-hover:text-foreground transition
          "
        >
          {/* <span>version</span> */}
          <span className="text-foreground text-sm group-hover:text-foreground transition">
            {currentVersion}.0
          </span>
          <IconChevronDown size={14} strokeWidth={2} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" className="w-48">
        <DropdownMenuLabel className="text-xs">Stable releases</DropdownMenuLabel>
        {versions.map((version, index) => (
          <DropdownMenuItem
            key={version}
            onClick={() => onSelectVersion(version)}
            className="justify-between flex"
          >
            <span className={`${currentVersion === version ? 'font-bold' : ''}`}>
              Version {version}.0
            </span>
            {index === 0 && <Badge size="small">Latest</Badge>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
export default RevVersionDropdown
