import { cn } from 'ui'

interface WorkflowDiagramProps {
  className?: string
}

export function WorkflowDAG({ className }: WorkflowDiagramProps) {
  return (
    <div
      className={cn(
        'relative w-full max-w-[500px] aspect-square p-8 rounded-xl bg-surface-75 border',
        className
      )}
    >
      <svg viewBox="0 0 400 400" className="w-full h-full" fill="none">
        {/* Connection lines */}
        <path
          d="M200 80 L200 140"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground-muted"
        />
        <path
          d="M200 140 L100 200"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground-muted"
        />
        <path
          d="M200 140 L300 200"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground-muted"
        />
        <path
          d="M100 240 L200 300"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground-muted"
        />
        <path
          d="M300 240 L200 300"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground-muted"
        />
        <path
          d="M200 340 L200 380"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground-muted"
        />

        {/* Trigger node */}
        <g>
          <circle cx="200" cy="60" r="28" className="fill-brand-500" />
          <text
            x="200"
            y="65"
            textAnchor="middle"
            className="fill-white text-xs font-medium"
            style={{ fontSize: '11px' }}
          >
            Trigger
          </text>
        </g>

        {/* Parse step */}
        <g>
          <rect
            x="150"
            y="120"
            width="100"
            height="40"
            rx="8"
            className="fill-surface-200 stroke-border"
            strokeWidth="1"
          />
          <text
            x="200"
            y="145"
            textAnchor="middle"
            className="fill-foreground text-xs font-mono"
            style={{ fontSize: '11px' }}
          >
            parseInput
          </text>
        </g>

        {/* Parallel steps */}
        <g>
          <rect
            x="50"
            y="190"
            width="100"
            height="50"
            rx="8"
            className="fill-surface-200 stroke-brand-400"
            strokeWidth="2"
          />
          <text
            x="100"
            y="210"
            textAnchor="middle"
            className="fill-foreground text-xs font-mono"
            style={{ fontSize: '11px' }}
          >
            enrichData
          </text>
          <text
            x="100"
            y="228"
            textAnchor="middle"
            className="fill-foreground-lighter text-xs"
            style={{ fontSize: '9px' }}
          >
            running...
          </text>
        </g>

        <g>
          <rect
            x="250"
            y="190"
            width="100"
            height="50"
            rx="8"
            className="fill-background-surface-300 stroke-brand-500"
            strokeWidth="2"
          />
          <text
            x="300"
            y="210"
            textAnchor="middle"
            className="fill-foreground text-xs font-mono"
            style={{ fontSize: '11px' }}
          >
            callAPI
          </text>
          <text
            x="300"
            y="228"
            textAnchor="middle"
            className="fill-brand-500 text-xs font-medium"
            style={{ fontSize: '9px' }}
          >
            ✓ completed
          </text>
        </g>

        {/* Merge step */}
        <g>
          <rect
            x="150"
            y="290"
            width="100"
            height="40"
            rx="8"
            className="fill-surface-200 stroke-border"
            strokeWidth="1"
          />
          <text
            x="200"
            y="315"
            textAnchor="middle"
            className="fill-foreground-light text-xs font-mono"
            style={{ fontSize: '11px' }}
          >
            mergeResults
          </text>
        </g>

        {/* Output node */}
        <g>
          <circle cx="200" cy="380" r="16" className="fill-foreground-muted" />
          <circle cx="200" cy="380" r="8" className="fill-background" />
        </g>

        {/* Parallel indicator */}
        <text
          x="200"
          y="178"
          textAnchor="middle"
          className="fill-brand-500 text-xs font-medium"
          style={{ fontSize: '10px' }}
        >
          parallel
        </text>
      </svg>
    </div>
  )
}

export function WorkflowArchitecture({ className }: WorkflowDiagramProps) {
  return (
    <div
      className={cn(
        'relative w-full max-w-[500px] aspect-[4/3] p-6 rounded-xl bg-surface-75 border',
        className
      )}
    >
      <svg viewBox="0 0 480 360" className="w-full h-full" fill="none">
        {/* Your App */}
        <g>
          <rect
            x="20"
            y="30"
            width="120"
            height="60"
            rx="8"
            className="fill-surface-200 stroke-border"
            strokeWidth="1"
          />
          <text
            x="80"
            y="55"
            textAnchor="middle"
            className="fill-foreground text-xs font-medium"
            style={{ fontSize: '12px' }}
          >
            Your App
          </text>
          <text
            x="80"
            y="72"
            textAnchor="middle"
            className="fill-foreground-lighter text-xs"
            style={{ fontSize: '10px' }}
          >
            trigger workflow
          </text>
        </g>

        {/* Arrow from App to pgflow */}
        <path
          d="M140 60 L180 60"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground-muted"
          markerEnd="url(#arrowhead)"
        />

        {/* pgflow Engine */}
        <g>
          <rect
            x="180"
            y="20"
            width="140"
            height="80"
            rx="12"
            className="fill-brand-400/10 stroke-brand-500"
            strokeWidth="2"
          />
          <text
            x="250"
            y="50"
            textAnchor="middle"
            className="fill-brand-500 text-sm font-bold"
            style={{ fontSize: '14px' }}
          >
            pgflow
          </text>
          <text
            x="250"
            y="70"
            textAnchor="middle"
            className="fill-foreground-light text-xs"
            style={{ fontSize: '10px' }}
          >
            orchestrator
          </text>
          <text
            x="250"
            y="86"
            textAnchor="middle"
            className="fill-foreground-lighter text-xs"
            style={{ fontSize: '9px' }}
          >
            runs in Postgres
          </text>
        </g>

        {/* Arrow from pgflow to Edge Functions */}
        <path
          d="M320 60 L360 60"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground-muted"
          markerEnd="url(#arrowhead)"
        />

        {/* Edge Functions */}
        <g>
          <rect
            x="360"
            y="20"
            width="100"
            height="80"
            rx="8"
            className="fill-surface-200 stroke-border"
            strokeWidth="1"
          />
          <text
            x="410"
            y="50"
            textAnchor="middle"
            className="fill-foreground text-xs font-medium"
            style={{ fontSize: '11px' }}
          >
            Edge
          </text>
          <text
            x="410"
            y="66"
            textAnchor="middle"
            className="fill-foreground text-xs font-medium"
            style={{ fontSize: '11px' }}
          >
            Functions
          </text>
          <text
            x="410"
            y="86"
            textAnchor="middle"
            className="fill-foreground-lighter text-xs"
            style={{ fontSize: '9px' }}
          >
            workers
          </text>
        </g>

        {/* Postgres Database */}
        <g>
          <rect
            x="140"
            y="140"
            width="220"
            height="100"
            rx="12"
            className="fill-surface-200 stroke-foreground-muted"
            strokeWidth="2"
          />
          {/* Database icon */}
          <ellipse cx="250" cy="165" rx="40" ry="12" className="fill-foreground-muted/20 stroke-foreground-muted" strokeWidth="1" />
          <path d="M210 165 L210 195 Q210 207 250 207 Q290 207 290 195 L290 165" className="stroke-foreground-muted fill-none" strokeWidth="1" />
          <ellipse cx="250" cy="195" rx="40" ry="12" className="fill-none stroke-foreground-muted" strokeWidth="1" />
          
          <text
            x="250"
            y="182"
            textAnchor="middle"
            className="fill-foreground text-xs font-medium"
            style={{ fontSize: '10px' }}
          >
            Postgres
          </text>

          <text
            x="180"
            y="225"
            textAnchor="middle"
            className="fill-foreground-lighter text-xs"
            style={{ fontSize: '9px' }}
          >
            workflow state
          </text>
          <text
            x="250"
            y="225"
            textAnchor="middle"
            className="fill-foreground-lighter text-xs"
            style={{ fontSize: '9px' }}
          >
            •
          </text>
          <text
            x="320"
            y="225"
            textAnchor="middle"
            className="fill-foreground-lighter text-xs"
            style={{ fontSize: '9px' }}
          >
            step results
          </text>
        </g>

        {/* Arrows to/from Postgres */}
        <path
          d="M250 100 L250 140"
          stroke="currentColor"
          strokeWidth="2"
          className="text-brand-500"
          strokeDasharray="4 2"
        />
        <path
          d="M410 100 L410 180 L360 180"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground-muted"
        />

        {/* Features list */}
        <g>
          <rect
            x="20"
            y="270"
            width="440"
            height="70"
            rx="8"
            className="fill-surface-100 stroke-border"
            strokeWidth="1"
          />
          <text
            x="40"
            y="295"
            className="fill-foreground-light text-xs font-medium"
            style={{ fontSize: '11px' }}
          >
            ✓ Automatic retries
          </text>
          <text
            x="180"
            y="295"
            className="fill-foreground-light text-xs font-medium"
            style={{ fontSize: '11px' }}
          >
            ✓ Parallel execution
          </text>
          <text
            x="330"
            y="295"
            className="fill-foreground-light text-xs font-medium"
            style={{ fontSize: '11px' }}
          >
            ✓ Durable state
          </text>
          <text
            x="40"
            y="320"
            className="fill-foreground-light text-xs font-medium"
            style={{ fontSize: '11px' }}
          >
            ✓ Timeouts & deadlines
          </text>
          <text
            x="180"
            y="320"
            className="fill-foreground-light text-xs font-medium"
            style={{ fontSize: '11px' }}
          >
            ✓ Type-safe steps
          </text>
          <text
            x="330"
            y="320"
            className="fill-foreground-light text-xs font-medium"
            style={{ fontSize: '11px' }}
          >
            ✓ Observable
          </text>
        </g>

        {/* Arrowhead marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" className="fill-foreground-muted" />
          </marker>
        </defs>
      </svg>
    </div>
  )
}

export function WorkflowCode({ className }: WorkflowDiagramProps) {
  return (
    <div
      className={cn(
        'relative w-full max-w-[520px] rounded-xl bg-surface-75 border overflow-hidden font-mono text-sm',
        className
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-100 border-b">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive-400" />
          <div className="w-3 h-3 rounded-full bg-warning-400" />
          <div className="w-3 h-3 rounded-full bg-brand-400" />
        </div>
        <span className="text-foreground-lighter text-xs ml-2">order-workflow.ts</span>
      </div>
      <pre className="p-4 text-xs leading-relaxed overflow-x-auto">
        <code>
          <span className="text-purple-400">import</span>
          <span className="text-foreground"> {'{ Flow }'} </span>
          <span className="text-purple-400">from</span>
          <span className="text-brand-400"> "@pgflow/dsl"</span>
          <span className="text-foreground">;</span>
          {'\n\n'}
          <span className="text-purple-400">const</span>
          <span className="text-foreground"> orderFlow = </span>
          <span className="text-purple-400">new</span>
          <span className="text-brand-300"> Flow</span>
          <span className="text-foreground">{'<{ orderId: string }>'}</span>
          <span className="text-foreground">({'{'}</span>
          {'\n'}
          <span className="text-foreground">  slug: </span>
          <span className="text-brand-400">"process-order"</span>
          <span className="text-foreground">,</span>
          {'\n'}
          <span className="text-foreground">  maxAttempts: </span>
          <span className="text-warning-400">3</span>
          <span className="text-foreground">,</span>
          {'\n'}
          <span className="text-foreground">{'})'}</span>
          {'\n'}
          <span className="text-foreground">  .</span>
          <span className="text-brand-300">step</span>
          <span className="text-foreground">({'{ slug: '}</span>
          <span className="text-brand-400">"validate"</span>
          <span className="text-foreground">{' }, validateOrder)'}</span>
          {'\n'}
          <span className="text-foreground">  .</span>
          <span className="text-brand-300">step</span>
          <span className="text-foreground">({'{ slug: '}</span>
          <span className="text-brand-400">"payment"</span>
          <span className="text-foreground">{', dependsOn: ['}</span>
          <span className="text-brand-400">"validate"</span>
          <span className="text-foreground">{'] }, chargeCard)'}</span>
          {'\n'}
          <span className="text-foreground">  .</span>
          <span className="text-brand-300">step</span>
          <span className="text-foreground">({'{ slug: '}</span>
          <span className="text-brand-400">"inventory"</span>
          <span className="text-foreground">{', dependsOn: ['}</span>
          <span className="text-brand-400">"validate"</span>
          <span className="text-foreground">{'] }, reserveStock)'}</span>
          {'\n'}
          <span className="text-foreground">  .</span>
          <span className="text-brand-300">step</span>
          <span className="text-foreground">({'{ slug: '}</span>
          <span className="text-brand-400">"notify"</span>
          <span className="text-foreground">{', dependsOn: ['}</span>
          <span className="text-brand-400">"payment"</span>
          <span className="text-foreground">, </span>
          <span className="text-brand-400">"inventory"</span>
          <span className="text-foreground">{'] }, sendEmail);'}</span>
          {'\n\n'}
          <span className="text-foreground-muted">// Trigger the workflow</span>
          {'\n'}
          <span className="text-purple-400">await</span>
          <span className="text-foreground"> orderFlow.</span>
          <span className="text-brand-300">start</span>
          <span className="text-foreground">({'{ orderId: '}</span>
          <span className="text-brand-400">"ord_123"</span>
          <span className="text-foreground">{' });'}</span>
        </code>
      </pre>
    </div>
  )
}

export function WorkflowMonitor({ className }: WorkflowDiagramProps) {
  return (
    <div
      className={cn(
        'relative w-full max-w-[520px] rounded-xl bg-surface-75 border overflow-hidden',
        className
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-100 border-b">
        <span className="text-foreground text-sm font-medium">Workflow Execution</span>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-brand-400/20 text-brand-400 text-xs font-medium">
          Running
        </span>
      </div>
      <div className="p-4 space-y-3">
        {/* Run info */}
        <div className="flex items-center gap-4 text-xs text-foreground-lighter pb-3 border-b border-border">
          <span>
            Run: <span className="text-foreground font-mono">run_8x7kq2</span>
          </span>
          <span>
            Started: <span className="text-foreground">2.4s ago</span>
          </span>
          <span>
            Input: <span className="text-foreground font-mono">{'{ orderId: "ord_123" }'}</span>
          </span>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          <StepRow name="validate" status="completed" duration="120ms" />
          <div className="flex gap-2 pl-4">
            <StepRow name="payment" status="completed" duration="890ms" />
            <StepRow name="inventory" status="running" />
          </div>
          <StepRow name="notify" status="pending" />
        </div>
      </div>
    </div>
  )
}

function StepRow({
  name,
  status,
  duration,
}: {
  name: string
  status: 'completed' | 'running' | 'pending' | 'failed'
  duration?: string
}) {
  const statusStyles = {
    completed: 'bg-brand-500',
    running: 'bg-warning-400 animate-pulse',
    pending: 'bg-foreground-muted/30',
    failed: 'bg-destructive-500',
  }

  const textStyles = {
    completed: 'text-foreground',
    running: 'text-warning-400',
    pending: 'text-foreground-muted',
    failed: 'text-destructive-400',
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-100 flex-1">
      <div className={cn('w-2 h-2 rounded-full', statusStyles[status])} />
      <span className={cn('font-mono text-xs', textStyles[status])}>{name}</span>
      {duration && <span className="ml-auto text-xs text-foreground-lighter">{duration}</span>}
      {status === 'running' && (
        <span className="ml-auto text-xs text-warning-400 animate-pulse">processing...</span>
      )}
    </div>
  )
}

