import { Checkbox_Shadcn_ } from 'ui'

type Props = {
  acknowledgedAll: boolean
  setAcknowledgedAll: (value: boolean) => void
  max: number
}

export const DeleteOrganizationButtonSingleAck = ({
  acknowledgedAll,
  setAcknowledgedAll,
  max,
}: Props) => {
  return (
    <div className="mt-2 rounded-md border border-warning bg-warning/5 px-3 py-3">
      <p className="text-sm text-foreground">
        This organization contains more than {max} projects.
      </p>

      <div
        className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-foreground"
        onClick={() => setAcknowledgedAll(!acknowledgedAll)}
      >
        <Checkbox_Shadcn_
          checked={acknowledgedAll}
          onCheckedChange={(checked) => setAcknowledgedAll(checked === true)}
          onClick={(e) => e.stopPropagation()}
        />
        I understand that all projects will be permanently deleted.
      </div>
    </div>
  )
}
