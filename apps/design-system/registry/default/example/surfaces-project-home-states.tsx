'use client'

import { useState } from 'react'
import { ProjectHome, type ProjectHomeProps } from 'surfaces/project'
import { Button } from 'ui'

import { sampleCapabilities, sampleProject } from './surfaces-sample-data'

const states: { label: string; overview: ProjectHomeProps['overview'] }[] = [
  { label: 'Loading', overview: { status: 'loading' } },
  { label: 'Error', overview: { status: 'error', message: 'The project overview timed out.' } },
  { label: 'Unavailable', overview: { status: 'idle' } },
]

export default function SurfacesProjectHomeStates() {
  const [index, setIndex] = useState(0)

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex gap-2" role="group" aria-label="Overview state">
        {states.map((state, i) => (
          <Button
            key={state.label}
            variant={i === index ? 'default' : 'outline'}
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
          >
            {state.label}
          </Button>
        ))}
      </div>
      <div className="flex h-[520px] min-h-0 flex-col overflow-hidden rounded-md border">
        <ProjectHome
          project={sampleProject}
          capabilities={sampleCapabilities}
          organizationName="Acme"
          overview={states[index].overview}
          onRefresh={() => {}}
        />
      </div>
    </div>
  )
}
