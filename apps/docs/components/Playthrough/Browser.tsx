import React from 'react'
import { nextStep } from './steps'
import { Button, Launching, Login, NewProject, ProjectDetails } from './SupabaseWebsite'
import { ReloadIcon } from '@radix-ui/react-icons'

export function Browser({ screen, url }) {
  return (
    <BrowserChrome url={url}>
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          height: '100%',
          color: 'white',
          textAlign: 'center',
          background: '#232323',
        }}
      >
        {screen === 'login' && <Login onEvent={nextStep} />}
        {screen === 'new project' && <NewProject onEvent={nextStep} />}
        {screen === 'project details' && <ProjectDetails onEvent={nextStep} />}
        {screen === 'launch database' && <Launching onEvent={nextStep} />}
        {screen === 'go to editor' && <Button onEvent={nextStep} text="SQL Editor" />}
        {screen === 'editor' && <Button onEvent={nextStep} text="User Management Starter" />}
        {screen === 'query' && <Button onEvent={nextStep} text="Run" />}
      </div>
    </BrowserChrome>
  )
}

function BrowserChrome({ url, children }) {
  return (
    <div style={{ display: 'flex', flexFlow: 'column', height: '100%' }}>
      <div
        style={{
          background: '#111',
          height: 24,
          width: '100%',
          alignItems: 'center',
        }}
        className="flex px-2 gap-2 bg-neutral-900"
      >
        <ReloadIcon width="16" height="16" className="text-white" />
        <div
          className="rounded bg-neutral-800 px-3 text-neutral-400 flex-1"
          style={{
            height: 18,
            lineHeight: '18px',
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}
