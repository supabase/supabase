'use client'

import { getPrereleaseStage, REFERENCES } from '~/content/navigation.references'
import { ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

const RevVersionDropdown = ({
  library,
  currentVersion,
}: {
  library: string
  currentVersion: string
}) => {
  const { push } = useRouter()

  const libraryMeta = REFERENCES?.[library] ?? undefined
  const versions = libraryMeta?.versions ?? []

  if (!versions || versions.length <= 1) {
    return null
  }

  const prereleaseVersions = versions.flatMap((version) => {
    const stage = getPrereleaseStage(library, version)
    return stage ? [{ version, stage }] : []
  })
  const stableVersions = versions.filter((version) => !getPrereleaseStage(library, version))

  const onSelectVersion = (version: string) => {
    if (version === versions[0]) {
      push(`/reference/${library}`)
    } else {
      push(`/reference/${library}/${version}`)
    }
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
          border-control px-2 h-[32px] rounded-sm
          layout-v2:h-6 layout-v2:px-1.5 layout-v2:rounded-md
          font-mono
          flex items-center gap-1 text-foreground-muted text-xs group-hover:text-foreground transition
          "
        >
          <span className="text-foreground text-sm layout-v2:text-xs group-hover:text-foreground transition">
            {currentVersion}.0
          </span>
          <ChevronDown size={14} strokeWidth={2} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" className="w-48">
        <DropdownMenuLabel className="text-xs">Stable releases</DropdownMenuLabel>
        {stableVersions.map((version) => (
          <DropdownMenuItem
            key={version}
            onClick={() => onSelectVersion(version)}
            className="justify-between flex"
          >
            <span className={`${currentVersion === version ? 'font-bold' : ''}`}>
              Version {version}.0
            </span>
            {version === versions[0] && <Badge>Latest</Badge>}
          </DropdownMenuItem>
        ))}
        {prereleaseVersions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Prereleases</DropdownMenuLabel>
            {prereleaseVersions.map(({ version, stage }) => (
              <DropdownMenuItem
                key={version}
                onClick={() => onSelectVersion(version)}
                className="justify-between flex"
              >
                <span className={`${currentVersion === version ? 'font-bold' : ''}`}>
                  Version {version}.0
                </span>
                <Badge variant="warning" className="capitalize">
                  {stage}
                </Badge>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
export default RevVersionDropdown
