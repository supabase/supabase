import { useEffect, useRef, useState } from 'react'
import { useMockProject } from '../providers/MockProjectContext'

const BRAND = '#3ecf8e'

// ---------------------------------------------------------------------------
// Sequence of frames, each auto-advancing after `delay` ms from start
// ---------------------------------------------------------------------------

interface Frame {
  // Completed steps shown above active
  completed: { label: string; answer?: string; isInfo?: boolean }[]
  // Currently active step
  active:
    | { type: 'select'; question: string; options: { label: string; detail?: string; selected: boolean }[] }
    | { type: 'search'; question: string; results: string[]; selectedIdx: number }
    | { type: 'info'; text: string; spinner?: boolean }
    | { type: 'final' }
  // Side-effects to fire when this frame becomes active
  sideEffects?: { org?: string; project?: string; reveal?: boolean; hide?: boolean }
}

const FRAMES: { delay: number; frame: Frame }[] = [
  {
    delay: 0,
    frame: {
      completed: [],
      active: {
        type: 'select',
        question: 'How would you like to develop?',
        options: [
          { label: 'Local development', detail: 'No account needed, connect to cloud later', selected: false },
          { label: 'Connect to existing project', selected: true },
          { label: 'Create a new project', selected: false },
        ],
      },
    },
  },
  {
    delay: 600,
    frame: {
      completed: [{ label: 'How would you like to develop?', answer: 'Connect to existing project' }],
      active: { type: 'info', text: 'Found 2 organizations', spinner: false },
    },
  },
  {
    delay: 950,
    frame: {
      completed: [
        { label: 'How would you like to develop?', answer: 'Connect to existing project' },
        { label: 'Found 2 organizations', isInfo: true },
      ],
      active: {
        type: 'select',
        question: 'Organization',
        options: [
          { label: 'Use existing', detail: 'acme, personal', selected: true },
          { label: 'Create new', selected: false },
        ],
      },
    },
  },
  {
    delay: 1600,
    frame: {
      completed: [
        { label: 'How would you like to develop?', answer: 'Connect to existing project' },
        { label: 'Found 2 organizations', isInfo: true },
        { label: 'Organization', answer: 'Use existing' },
      ],
      active: {
        type: 'search',
        question: 'Select organization',
        results: ['acme (fttpoaajunubjfpnnsgb)', 'personal (cjiaqhtvoirktlhfjwgm)'],
        selectedIdx: 0,
      },
    },
  },
  {
    delay: 2200,
    frame: {
      completed: [
        { label: 'How would you like to develop?', answer: 'Connect to existing project' },
        { label: 'Found 2 organizations', isInfo: true },
        { label: 'Organization', answer: 'Use existing' },
        { label: 'Select organization', answer: 'acme' },
      ],
      active: { type: 'info', text: 'Found 1 project in acme' },
      sideEffects: { org: 'acme' },
    },
  },
  {
    delay: 2700,
    frame: {
      completed: [
        { label: 'How would you like to develop?', answer: 'Connect to existing project' },
        { label: 'Found 2 organizations', isInfo: true },
        { label: 'Organization', answer: 'Use existing' },
        { label: 'Select organization', answer: 'acme' },
        { label: 'Found 1 project in acme', isInfo: true },
      ],
      active: {
        type: 'select',
        question: 'Project',
        options: [
          { label: 'Use existing', detail: 'url-shortner-app', selected: true },
          { label: 'Create new', selected: false },
        ],
      },
    },
  },
  {
    delay: 3300,
    frame: {
      completed: [
        { label: 'How would you like to develop?', answer: 'Connect to existing project' },
        { label: 'Found 2 organizations', isInfo: true },
        { label: 'Organization', answer: 'Use existing' },
        { label: 'Select organization', answer: 'acme' },
        { label: 'Found 1 project in acme', isInfo: true },
        { label: 'Project', answer: 'url-shortner-app' },
      ],
      active: {
        type: 'select',
        question: 'Schema management',
        options: [
          { label: 'Declarative (recommended)', detail: 'Write what you want, we figure out the changes', selected: true },
          { label: 'Migrations', selected: false },
        ],
      },
      sideEffects: { project: 'url-shortner-app' },
    },
  },
  {
    delay: 3900,
    frame: {
      completed: [
        { label: 'How would you like to develop?', answer: 'Connect to existing project' },
        { label: 'Found 2 organizations', isInfo: true },
        { label: 'Organization', answer: 'Use existing' },
        { label: 'Select organization', answer: 'acme' },
        { label: 'Found 1 project in acme', isInfo: true },
        { label: 'Project', answer: 'url-shortner-app' },
        { label: 'Schema management', answer: 'Declarative (recommended)' },
      ],
      active: {
        type: 'select',
        question: 'Config source',
        options: [
          { label: 'In code (recommended)', detail: 'config.json is source of truth', selected: true },
          { label: 'Remote (dashboard)', selected: false },
        ],
      },
    },
  },
  {
    delay: 4500,
    frame: {
      completed: [
        { label: 'How would you like to develop?', answer: 'Connect to existing project' },
        { label: 'Found 2 organizations', isInfo: true },
        { label: 'Organization', answer: 'Use existing' },
        { label: 'Select organization', answer: 'acme' },
        { label: 'Found 1 project in acme', isInfo: true },
        { label: 'Project', answer: 'url-shortner-app' },
        { label: 'Schema management', answer: 'Declarative (recommended)' },
        { label: 'Config source', answer: 'In code (recommended)' },
      ],
      active: { type: 'info', text: 'Fetching project config...', spinner: true },
    },
  },
  {
    delay: 5400,
    frame: {
      completed: [],
      active: { type: 'final' },
      sideEffects: { reveal: true },
    },
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CLIScreen() {
  const { setProject, revealDashboard, hideDashboard } = useMockProject()
  const [frameIdx, setFrameIdx] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const schedule = () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    setFrameIdx(0)
    hideDashboard()

    FRAMES.forEach((f, i) => {
      const t = setTimeout(() => {
        setFrameIdx(i)
        const fx = f.frame.sideEffects
        if (fx?.org) setProject({ organization: { name: fx.org, slug: fx.org.toLowerCase(), plan: 'Free' } })
        if (fx?.project) setProject({ name: fx.project })
        if (fx?.reveal) revealDashboard()
        if (fx?.hide) hideDashboard()
      }, f.delay)
      timeoutsRef.current.push(t)
    })

  }

  useEffect(() => {
    schedule()
    return () => timeoutsRef.current.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [frameIdx])

  const { completed, active } = FRAMES[frameIdx].frame

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-4 py-3 font-mono text-[11px] leading-5"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* Header */}
      <div className="mb-2">
        <span className="text-foreground-light">{'> '}</span>
        <span className="text-foreground font-bold">supa init</span>
      </div>
      <div className="mb-0.5 font-bold" style={{ color: BRAND }}>SUPABASE</div>
      <div className="text-foreground-lighter mb-3">
        Initialize a new Supabase project in this directory.
      </div>
      <div className="mb-3">
        <span className="rounded px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: BRAND, color: '#000' }}>
          supa init
        </span>
      </div>

      {active.type === 'final' ? (
        <FinalOutput />
      ) : (
        <>
          {/* Completed steps */}
          {completed.map((c, i) => (
            <StepRow key={i} state="done" showLine={i < completed.length - 1 || true}>
              <span className="text-foreground font-bold">{c.label}</span>
              {!c.isInfo && c.answer && <span className="text-foreground-lighter"> · {c.answer}</span>}
            </StepRow>
          ))}

          {/* Active step */}
          <StepRow state="active" showLine={false}>
            {active.type === 'info' && (
              <div className="flex items-center gap-1.5">
                {active.spinner && (
                  <span className="text-[10px] leading-none" style={{ color: '#818cf8' }}>◐</span>
                )}
                <span className="text-foreground font-bold">{active.text}</span>
              </div>
            )}
            {active.type === 'select' && (
              <div className="flex flex-col">
                <span className="text-foreground font-bold mb-0.5">{active.question}</span>
                {active.options.map((opt, i) => (
                  <div key={i} className="flex items-baseline gap-1.5">
                    <span style={{ color: opt.selected ? BRAND : undefined }} className={opt.selected ? '' : 'text-foreground-lighter'}>
                      {opt.selected ? '●' : '○'}
                    </span>
                    <span className={opt.selected ? 'text-foreground font-semibold' : 'text-foreground-lighter'}>
                      {opt.label}
                    </span>
                    {opt.detail && <span className="text-foreground-lighter opacity-70">({opt.detail})</span>}
                  </div>
                ))}
              </div>
            )}
            {active.type === 'search' && (
              <div className="flex flex-col">
                <span className="text-foreground font-bold mb-0.5">{active.question}</span>
                <div className="text-foreground-light mb-0.5">
                  Search: <span className="inline-block w-1.5 h-3 bg-foreground/70 align-middle animate-pulse" />
                </div>
                <div className="text-foreground-lighter text-[10px] mb-1">↑↓ navigate, enter select, esc cancel</div>
                {active.results.map((r, i) => (
                  <div key={i} className="flex items-baseline gap-1">
                    <span style={{ color: i === active.selectedIdx ? BRAND : 'transparent' }}>›</span>
                    <span className={i === active.selectedIdx ? 'text-foreground' : 'text-foreground-lighter'}>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </StepRow>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// StepRow
// ---------------------------------------------------------------------------

function StepRow({ state, showLine, children }: { state: 'done' | 'active'; showLine: boolean; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <div className="flex flex-col items-center" style={{ width: 14, minWidth: 14 }}>
        {state === 'active' ? (
          <span className="shrink-0 select-none text-[10px] leading-none mt-px" style={{ color: BRAND }}>◆</span>
        ) : (
          <span className="shrink-0 select-none text-[10px] leading-none mt-px text-foreground-muted">◇</span>
        )}
        {showLine && (
          <div className="flex-1 w-px mt-0.5" style={{ backgroundColor: '#3ecf8e22', minHeight: 6 }} />
        )}
      </div>
      <div className="flex-1 pb-1.5 flex items-baseline flex-wrap gap-0.5">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FinalOutput
// ---------------------------------------------------------------------------

function FinalOutput() {
  const lines = [
    { text: 'Created a new project: "url-shortner-app"', style: 'title' as const },
    { text: '', style: 'blank' as const },
    { text: 'Project', style: 'section' as const },
    { text: 'ID: ijzhztkskjuuxnpinfjh', style: 'kv' as const },
    { text: 'Dashboard: https://supabase.com/dashboard/project/ijzhztkskjuuxnpinfjh', style: 'link' as const },
    { text: '', style: 'blank' as const },
    { text: 'API Credentials', style: 'section' as const },
    { text: 'URL: https://ijzhztkskjuuxnpinfjh.supabase.co', style: 'link' as const },
    { text: 'Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', style: 'kv' as const },
    { text: 'Secret Key: [hidden] run "supa project api-keys --reveal"', style: 'kv' as const },
    { text: '', style: 'blank' as const },
    { text: 'Created in ./supabase/', style: 'section' as const },
    { text: '  config.json', style: 'dim' as const },
    { text: '  migrations/', style: 'dim' as const },
    { text: '  functions/', style: 'dim' as const },
    { text: '  types/', style: 'dim' as const },
    { text: '', style: 'blank' as const },
    { text: 'Tip: Use --json for structured output when scripting', style: 'dim' as const },
  ]

  return (
    <div className="flex flex-col">
      {lines.map((line, i) => {
        if (line.style === 'blank') return <div key={i} className="h-2" />
        if (line.style === 'title') return <div key={i} className="text-foreground mb-0.5">{line.text}</div>
        if (line.style === 'section') return <div key={i} className="text-foreground-light mt-0.5">{line.text}</div>
        if (line.style === 'link') {
          const parts = line.text.split(/(https:\/\/\S+)/)
          return (
            <div key={i} className="text-foreground-light">
              {parts.map((p, j) => p.startsWith('https://') ? <span key={j} style={{ color: '#38bdf8' }}>{p}</span> : <span key={j}>{p}</span>)}
            </div>
          )
        }
        if (line.style === 'kv') {
          const colon = line.text.indexOf(':')
          return (
            <div key={i} className="text-foreground-light">
              <span className="text-foreground-lighter">{line.text.slice(0, colon)}:</span>
              {line.text.slice(colon + 1)}
            </div>
          )
        }
        return <div key={i} className="text-foreground-lighter">{line.text}</div>
      })}
    </div>
  )
}
