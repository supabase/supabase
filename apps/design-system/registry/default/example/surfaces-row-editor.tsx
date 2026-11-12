'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { RowEditorForm, type SaveRow } from 'surfaces/row'

import { companies, companiesTable, roundTrip } from './surfaces-sample-data'

export default function SurfacesRowEditor() {
  const [row, setRow] = useState(companies[0])
  const [revision, setRevision] = useState(0)

  // The host applies the change and returns the row as stored.
  const handleSave: SaveRow = (change) =>
    roundTrip({ ...(change.kind === 'update' ? change.key : {}), ...row, ...change.values })

  return (
    <div className="flex h-[560px] w-full max-w-lg flex-col overflow-hidden rounded-md border">
      <RowEditorForm
        key={revision}
        table={companiesTable}
        row={row}
        onSave={handleSave}
        saved={(stored) => {
          setRow(stored)
          setRevision((value) => value + 1)
          toast('Row saved')
        }}
        close={() => setRevision((value) => value + 1)}
      />
    </div>
  )
}
