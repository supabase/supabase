import type { UseFormReturn } from 'react-hook-form'

import { AdvancedSettings } from '../DestinationPanel/DestinationForm/AdvancedSettings'
import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { PublicationSelection } from '../DestinationPanel/DestinationForm/PublicationSelection'
import { TableCopySelection } from '../DestinationPanel/DestinationForm/TableCopySelection'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'

export const PipelineDataSection = ({
  type,
  form,
  onSelectNewPublication,
  revealInvalidSettings = false,
}: {
  type: DestinationType
  form: UseFormReturn<DestinationPanelSchemaType>
  onSelectNewPublication: () => void
  revealInvalidSettings?: boolean
}) => (
  <section aria-label="Data">
    <div className="p-5 flex flex-col gap-y-6">
      <h3 className="text-sm font-medium text-foreground">Data</h3>
      <div className="flex flex-col gap-y-4">
        <PublicationSelection form={form} onSelectNewPublication={onSelectNewPublication} />
        <TableCopySelection form={form} editMode={false} />
      </div>
    </div>
    <AdvancedSettings
      type={type}
      form={form}
      group="data"
      revealInvalidSettings={revealInvalidSettings}
    />
  </section>
)
