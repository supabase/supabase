import { useState } from 'react'
import { useRouter } from 'next/router'
import { ChevronDown, Check, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { IS_PLATFORM } from 'lib/constants'

interface Project {
  id: number
  ref: string
  name: string
  status: string
}

interface ProjectSwitcherProps {
  currentProjectRef?: string
}

export const ProjectSwitcher = ({ currentProjectRef }: ProjectSwitcherProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const response = await fetch('/api/platform/projects')
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      return response.json()
    },
    enabled: !IS_PLATFORM, // Only fetch for self-hosted
  })

  const currentProject = projects.find((p) => p.ref === currentProjectRef)

  // Only show for self-hosted with multiple projects
  if (IS_PLATFORM || projects.length <= 1) {
    return null
  }

  const handleProjectSelect = (projectRef: string) => {
    setOpen(false)
    // Navigate to the same page but with different project
    const currentPath = router.asPath
    const newPath = currentPath.replace(
      /\/project\/[^\/]+/,
      `/project/${projectRef}`
    )
    router.push(newPath)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="text"
          size="tiny"
          className="flex items-center gap-1 px-2 py-1 text-xs"
          iconRight={<ChevronDown size={12} />}
        >
          {currentProject?.name || 'Select Project'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {isLoading ? (
          <DropdownMenuItem disabled>Loading projects...</DropdownMenuItem>
        ) : (
          <>
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.ref}
                className="flex items-center justify-between"
                onClick={() => handleProjectSelect(project.ref)}
              >
                <span className="truncate">{project.name}</span>
                {project.ref === currentProjectRef && (
                  <Check size={14} className="text-brand" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => {
                setOpen(false)
                router.push('/org/default')
              }}
            >
              <Plus size={14} />
              <span>New Project</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
