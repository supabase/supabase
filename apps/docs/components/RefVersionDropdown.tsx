'use client'

import { ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from 'ui'

import { REFERENCES } from '~/content/navigation.references'

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
    return <></>
  }

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
          border-control px-2 h-[32px] rounded
          font-mono
          flex items-center gap-1 text-foreground-muted text-xs group-hover:text-foreground transition
          "
        >
          <span className="text-foreground text-sm group-hover:text-foreground transition">
            {currentVersion}.0
          </span>
          <ChevronDown size={14} strokeWidth={2} />
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
