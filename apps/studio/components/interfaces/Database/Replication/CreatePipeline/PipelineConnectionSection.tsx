import type { ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { DialogSectionSeparator } from 'ui'

import { AdvancedSettings } from '../DestinationPanel/DestinationForm/AdvancedSettings'
import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { DestinationNameInput } from '../DestinationPanel/DestinationForm/DestinationNameInput'
import { PipelineRegionField } from '../DestinationPanel/DestinationForm/PipelineRegionField'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'

export const PipelineConnectionSection = ({
  type,
  form,
  children,
  revealInvalidSettings = false,
}: {
  type: DestinationType
  form: UseFormReturn<DestinationPanelSchemaType>
  children: ReactNode
  revealInvalidSettings?: boolean
}) => (
  <section aria-label="Destination connection">
    <div className="flex flex-col gap-y-4 p-5">
      <h3 className="text-sm font-medium text-foreground">Destination connection</h3>
      <DestinationNameInput form={form} destinationType={type} />
      <PipelineRegionField destinationType={type} />
    </div>
    <DialogSectionSeparator />
    {children}
    <AdvancedSettings
      type={type}
      form={form}
      group="connection"
      revealInvalidSettings={revealInvalidSettings}
    />
  </section>
)
