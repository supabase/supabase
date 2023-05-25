import { IconChevronRight, Listbox } from 'ui'

const ProjectLinker = () => {
  return <div></div>
}

export default ProjectLinker

type ProjectLinkerItemProps = {}
const ProjectLinkerItem = ({}: ProjectLinkerItemProps) => {
  function onVercelProjectChange(e: string) {
    const value = e != UNDEFINED_SELECT_VALUE ? e : undefined
  }

  function onSupabaseProjectChange(e: string) {
    const value = e != UNDEFINED_SELECT_VALUE ? e : undefined
  }

  function onRemove() {}

  return (
    <li className="py-2">
      <div className="relative flex w-full space-x-2">
        <div className="w-1/2 flex-grow">
          <Listbox
            value={vercelProjectId ?? UNDEFINED_SELECT_VALUE}
            onChange={onVercelProjectChange}
          >
            <Listbox.Option value={UNDEFINED_SELECT_VALUE} label="Choose a project" disabled>
              Choose a project
            </Listbox.Option>
            {selectedVercelProject && (
              <Listbox.Option
                value={selectedVercelProject.id}
                label={selectedVercelProject.name}
                addOnBefore={() => vercelIcon}
              >
                {selectedVercelProject.name}
              </Listbox.Option>
            )}
            {_store.vercelProjectsAvailable.map((x) => (
              <Listbox.Option key={x.id} value={x.id} label={x.name} addOnBefore={() => vercelIcon}>
                {x.name}
              </Listbox.Option>
            ))}
          </Listbox>
        </div>
        <div className="flex flex-shrink items-center">
          <IconChevronRight className="text-scale-1000" />
        </div>
        <div className="w-1/2 flex-grow">
          <Listbox
            value={supabaseProjectRef ?? UNDEFINED_SELECT_VALUE}
            onChange={onSupabaseProjectChange}
          >
            <Listbox.Option value={UNDEFINED_SELECT_VALUE} label="Choose a project" disabled>
              Choose a project
            </Listbox.Option>
            {sortedProjects?.map((x: Dictionary<any>) => (
              <Listbox.Option
                key={x.id}
                value={x.ref}
                label={x.name}
                addOnBefore={() => databaseIcon}
              >
                {x.name}
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
