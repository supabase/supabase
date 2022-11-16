import React from 'react'

export function Login({ onEvent }) {
  return (
    <div style={{ width: 400 }}>
      <button
        className="bg-brand-fixed-800 rounded px-4 py-2 text-white cursor-pointer"
        onClick={() => onEvent('login')}
      >
        Sign In with GitHub
      </button>
      <p className="mt-6" style={{ color: '#a0a0a0', fontSize: 12 }}>
        By continuing, you agree to Supabase&apos;s Terms of Service and Privacy Policy, and to
        receive periodic emails with updates.
      </p>
    </div>
  )
}

export function NewProject({ onEvent }) {
  return (
    <div style={{ width: 400 }}>
      <div style={{ textAlign: 'left', marginBottom: 12 }}>Lorem Ipsums Org</div>
      <div className="p-4 border border-gray-900 border-dashed rounded">
        <h2 style={{ fontSize: 18 }}>No projects</h2>
        <p style={{ fontSize: 14, color: '#999' }}>Get started by creating a new project.</p>
        <button
          className="mt-4 bg-brand-fixed-800 rounded px-4 py-2 text-white cursor-pointer"
          onClick={() => onEvent('login')}
        >
          New Project
        </button>
      </div>
    </div>
  )
}
export function Launching({ onEvent }) {
  return <div>Launching database...</div>
}
export function Button({ onEvent, text }) {
  return (
    <div>
      <div style={{ fontSize: 14, color: '#999', marginBottom: 24 }}>[rest of the UI]</div>
      <button
        className="mb-4 bg-brand-fixed-800 rounded px-4 py-2 text-white cursor-pointer"
        onClick={() => onEvent(text)}
      >
        {text}
      </button>
    </div>
  )
}
export function ProjectDetails({ onEvent }) {
  const ref = React.useRef()
  return (
    <div style={{ width: 400 }}>
      <div style={{ borderRadius: 4, background: '#262626', textAlign: 'left' }}>
        <div style={{ padding: 14 }}>Create a new project</div>
        <div>
          <span
            style={{
              display: 'inline-block',
              width: 100,
              padding: '6px 14px',
              color: '#bbb',
            }}
          >
            Name
          </span>
          <input ref={ref} type="text" style={{ padding: 0, color: 'black' }}></input>
          <br />

          <span
            style={{
              display: 'inline-block',
              width: 100,
              padding: '0px 14px',
              color: '#bbb',
            }}
          >
            Password
          </span>
          <input type="password" style={{ padding: 0, color: 'black' }}></input>
        </div>
        <div style={{ padding: 14, textAlign: 'right' }}>
          <button
            className="bg-brand-fixed-800 rounded px-4 py-2 text-white cursor-pointer"
            onClick={() => {
              onEvent('create')
              setTimeout(() => {
                onEvent('launch database')
              }, 2000)
            }}
          >
            Create new Project
          </button>
        </div>
      </div>
    </div>
  )
}
