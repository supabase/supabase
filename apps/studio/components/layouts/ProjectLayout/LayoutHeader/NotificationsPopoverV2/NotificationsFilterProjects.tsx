import { useProjectsQuery } from 'data/projects/projects-query'
import { useNotificationsStateSnapshot } from 'state/notifications'
import {
  Checkbox_Shadcn_,
  cn,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  DropdownMenuLabel,
  Label_Shadcn_,
} from 'ui'

export const NotificationsFilterProjects = () => {
  const snap = useNotificationsStateSnapshot()

  const { data } = useProjectsQuery()
  const projects = data?.projects ?? []

  return (
    <CommandGroup_Shadcn_>
      <DropdownMenuLabel>Projects</DropdownMenuLabel>
      {(projects ?? []).map((project) => (
        <CommandItem_Shadcn_
          key={project.ref}
          value={project.ref}
          className="flex items-center gap-x-2"
          onSelect={(event) => {
            snap.setFilters(project.ref, 'projects')
          }}
        >
          <Label_Shadcn_
            htmlFor={`${project.ref}`}
            className={cn(
              'flex items-center gap-x-2 text-xs text-foreground-light transition-colors',
              snap.filterProjects.includes(project.ref) && 'text-foreground'
            )}
          >
            <Checkbox_Shadcn_
              name={`${project.ref}`}
              checked={snap.filterProjects.includes(project.ref)}
              className=""
            />
            {project.name}
          </Label_Shadcn_>
        </CommandItem_Shadcn_>
      ))}
    </CommandGroup_Shadcn_>
  )
}
