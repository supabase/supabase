import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { get } from '~/lib/fetchWrappers'
import { paths } from '~/types/api'
import {
  Button_Shadcn_ as Button,
  Popover_Shadcn_ as Popover,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
  PopoverContent_Shadcn_ as PopoverContent,
  Command_Shadcn_ as Command,
  CommandInput_Shadcn_ as CommandInput,
  CommandEmpty_Shadcn_ as CommandEmpty,
  CommandItem_Shadcn_ as CommandItem,
  CommandGroup_Shadcn_ as CommandGroup,
  cn,
  IconCopy,
  IconCheck,
} from 'ui'
import CopyToClipboard from 'react-copy-to-clipboard'

interface ProjectKey {
  id: string
  orgName: string
  projectName: string
  branchName?: string
  endpoint: string
  keys: {
    anonKey: string
  }
}

async function listOrganizations() {
  return get('/platform/organizations', {}).then(({ data, error }) => {
    if (error) {
      throw error
    }
    return data
  })
}

async function listProjects() {
  return get('/platform/projects', {}).then(({ data, error }) => {
    if (error) {
      throw error
    }
    return data
  })
}

async function getProjectApiKeys(
  projectOrRef:
    | paths['/platform/projects']['get']['responses'][200]['content']['application/json'][number]
    | string
) {
  // Problem with the types codegen/OpenAPI spec
  // @ts-ignore
  const ref = typeof projectOrRef === 'string' ? projectOrRef : (projectOrRef.ref as string)

  return get('/platform/props/project/{ref}/api', {
    params: {
      path: { ref },
    },
  }).then(({ data: keys, error }) =>
    error
      ? null
      : {
          keys: { anonKey: keys.autoApiService.defaultApiKey },
          endpoint: `${keys.autoApiService.protocol ?? 'https'}://${keys.autoApiService.endpoint}`,
        }
  )
}

async function listAllProjectKeys() {
  const orgAndProjectQueries = [listOrganizations(), listProjects()] as const
  const [organizations, projects] = await Promise.all(orgAndProjectQueries)

  const projectKeysPending = projects.flatMap(async (project) => {
    const apiConfig = await getProjectApiKeys(project)
    if (!apiConfig) {
      return null
    }

    const orgName = organizations.find((org) => org.id === project.organization_id)?.name ?? ''

    const projectMain: ProjectKey = {
      id: `${orgName} / ${project.name}`,
      orgName,
      projectName: project.name,
      ...apiConfig,
    }

    // Problem with the types codegen/OpenAPI spec
    // @ts-ignore
    if (projects.preview_branch_refs?.length > 0) {
      const previewBranches: Array<ProjectKey | null> = await Promise.all(
        // Problem with the types codegen/OpenAPI spec
        // @ts-ignore
        projects.preview_branch_refs.map(async (branch: string) => {
          const [branchInfo, apiInfo] = await Promise.all([
            get('/platform/projects/{ref}', {
              params: {
                path: { ref: branch },
              },
            }).then(({ data, error }) => (error ? null : data)),
            getProjectApiKeys(branch),
          ])

          if (!branchInfo || !apiInfo) {
            return null
          }

          return {
            id: `${orgName} / ${project.name} / ${branchInfo.name}`,
            orgName,
            projectName: project.name,
            branchName: branchInfo.name,
            ...apiInfo,
          } as ProjectKey
        })
      )

      if (previewBranches.filter(Boolean).length > 0) {
        return [projectMain, ...previewBranches]
      }
    }

    return projectMain
  }) as unknown as ProjectKey[] // because TypeScript doesn't correctly type the flatMap result

  const projectKeys = await Promise.all(projectKeysPending)
  return projectKeys.filter(Boolean)
}

function useListAllProjectKeys() {
  const initialMount = useRef(true)
  const [projectKeys, setProjectKeys] = useState<ProjectKey[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (initialMount.current) {
      listAllProjectKeys()
        .then((keys) => {
          setProjectKeys(keys)
        })
        .catch(() => setIsError(true))
        .finally(() => setIsLoading(false))
      initialMount.current = false
    }
  }, [])

  return { projectKeys, isLoading, isError }
}

function ComboBox({
  projectKeysInfo,
  variable,
  selectedId,
  setSelectedId,
  isLoading,
}: {
  projectKeysInfo: ProjectKey[]
  variable: 'url' | 'anonKey'
  selectedId: string | null
  setSelectedId: Dispatch<SetStateAction<string>>
  isLoading: boolean
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1000)
  }

  // Conversion is necessary as Command will lowercase values
  const currentProject = projectKeysInfo.find(
    (project) => project.id.toLowerCase() === selectedId.toLowerCase()
  )
  const currentSelection =
    variable === 'url' ? currentProject?.endpoint : currentProject?.keys.anonKey

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="max-w-[90%] overflow-hidden justify-between"
          >
            {isLoading ? 'Loading...' : currentSelection || 'Select a project...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <CopyToClipboard text={currentSelection}>
          <Button variant="ghost" onClick={handleCopy} aria-label="Copy">
            {copied ? <IconCheck /> : <IconCopy />}
          </Button>
        </CopyToClipboard>
      </div>
      <PopoverContent className="w-[200px] p-0" side="bottom">
        <Command>
          <CommandInput placeholder="Search project..." className="border-none ring-0" />
          <CommandEmpty>No project found.</CommandEmpty>
          <CommandGroup>
            {projectKeysInfo.map((project) => (
              <CommandItem
                key={project.id}
                value={project.id}
                onSelect={(currentValue: string) => {
                  setSelectedId(currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedId.toLowerCase() === project.id.toLowerCase()
                      ? 'opacity-100'
                      : 'opacity-0'
                  )}
                />
                {project.id}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function ProjectConfigVariables({ variable }: { variable: 'url' | 'anonKey' }) {
  const { projectKeys, isLoading, isError } = useListAllProjectKeys()
  const [activeId, setActiveId] = useState<string>()

  if (projectKeys[0] && !activeId) {
    setActiveId(projectKeys[0].id)
  }

  if (isLoading) {
    return <span>Loading</span>
  }

  if (isError || projectKeys.length === 0) {
    return <span>YOUR ANON KEY</span>
  }

  return (
    <span>
      <ComboBox
        selectedId={activeId}
        setSelectedId={setActiveId}
        projectKeysInfo={projectKeys}
        variable={variable}
        isLoading={isLoading}
      />
    </span>
  )
}
