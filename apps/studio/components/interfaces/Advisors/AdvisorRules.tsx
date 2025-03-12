import { useParams } from 'common'
import { ScaffoldSection } from 'components/layouts/Scaffold'
import { useProjectLintRulesQuery } from 'data/lint/lint-rules-query'
import { useState } from 'react'
import { Button } from 'ui'
import { EditRulesSheet } from './EditRulesSheet'

export const AdvisorRules = () => {
  const { ref: projectRef } = useParams()
  const { data } = useProjectLintRulesQuery({ projectRef })

  const [showPanel, setShowPanel] = useState(false)

  const exceptions = data?.exceptions ?? []

  return (
    <>
      <ScaffoldSection isFullWidth>
        <div className="flex items-center justify-end">
          <Button onClick={() => setShowPanel(true)}>Create rule</Button>
        </div>
        <div>Hello</div>
      </ScaffoldSection>

      <EditRulesSheet open={showPanel} onOpenChange={setShowPanel} />
    </>
  )
}
