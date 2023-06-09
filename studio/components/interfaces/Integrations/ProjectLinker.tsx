import { databaseIcon, vercelIcon } from 'components/to-be-cleaned/ListIcons'
import { useState } from 'react'
import { IconChevronRight, Listbox } from 'ui'

interface Project {
  id: string
  name: string
}

export interface ProjectLinkerProps {
  foreignProjects: Project[]
  supabaseProjects: Project[]
}

const ProjectLinker = ({ foreignProjects, supabaseProjects }: ProjectLinkerProps) => {
  return (
    <div>
      <ProjectLinkerItem foreignProjects={foreignProjects} supabaseProjects={supabaseProjects} />
    </div>
  )
}

export default ProjectLinker

const UNDEFINED_SELECT_VALUE = 'undefined'

interface ProjectLinkerItemProps {
  foreignProjects: Project[]
  supabaseProjects: Project[]
}

const ProjectLinkerItem = ({ foreignProjects, supabaseProjects }: ProjectLinkerItemProps) => {
  const [foreignProjectId, setForeignProjectId] = useState<string>(UNDEFINED_SELECT_VALUE)
  const [supabaseProjectId, setSupabaseProjectId] = useState<string>(UNDEFINED_SELECT_VALUE)

  return (
    <li className="py-2">
      <div className="relative flex w-full space-x-2">
        <div className="w-1/2 flex-grow">
          <Listbox
            value={foreignProjectId ?? UNDEFINED_SELECT_VALUE}
            onChange={setForeignProjectId}
          >
            <Listbox.Option value={UNDEFINED_SELECT_VALUE} label="Choose a project" disabled>
              Choose a project
            </Listbox.Option>
            {/* {selectedForeignProject && (
              <Listbox.Option
                value={selectedForeignProject.id}
                label={selectedForeignProject.name}
                addOnBefore={() => vercelIcon}
              >
                {selectedForeignProject.name}
              </Listbox.Option>
            )} */}
            {foreignProjects.map((project) => (
              <Listbox.Option
                key={project.id}
                value={project.id}
                label={project.name}
                addOnBefore={() => vercelIcon}
              >
                {project.name}
              </Listbox.Option>
            ))}
          </Listbox>
        </div>
        <div className="flex flex-shrink items-center">
          <IconChevronRight className="text-scale-1000" />
        </div>
        <div className="w-1/2 flex-grow">
          <Listbox
            value={supabaseProjectId ?? UNDEFINED_SELECT_VALUE}
            onChange={setSupabaseProjectId}
          >
            <Listbox.Option value={UNDEFINED_SELECT_VALUE} label="Choose a project" disabled>
              Choose a project
            </Listbox.Option>
            {supabaseProjects.map((project) => (
              <Listbox.Option
                key={project.id}
                value={project.id}
                label={project.name}
                addOnBefore={() => databaseIcon}
              >
                {project.name}
              </Listbox.Option>
            ))}
          </Listbox>
        </div>
        {/* {idx != 0 && (
          <div className="absolute top-[3px] right-[-50px]">
            <Button
              type="text"
              icon={<IconX size="small" strokeWidth={2} />}
              onClick={onRemove}
              disabled={_store.waitingIntegration}
            />
          </div>
        )} */}
      </div>
    </li>
  )
}
