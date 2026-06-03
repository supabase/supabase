import Link from 'next/link'

const features = [
  {
    label: 'Global presence',
    paragraph: (
      <>
        Edge functions run globally or can be{' '}
        <Link
          href="https://supabase.com/docs/guides/functions/regional-invocation"
          className="underline hover:text-foreground-light transition-colors"
        >
          pinned to your database's proximity
        </Link>
      </>
    ),
  },
  {
    label: 'Automatic scaling',
    paragraph: 'Seamlessly scale with usage without any manual tuning',
  },
  {
    label: 'Secure',
    paragraph: 'Scale with confidence with SSL, Firewall and DDOS protection built in',
  },
]

export function GlobalPresenceSection() {
  return (
    <div className="mx-auto max-w-[75rem] px-6 py-16 md:py-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
        <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
          Edge Functions run{' '}
          <span className="text-foreground">
            server-side logic geographically close to users
          </span>
          , offering low latency and great performance.
        </h3>
        <div className="flex flex-col gap-6">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="flex flex-col gap-1 pl-3 border-l border-border text-sm"
            >
              <p className="font-mono uppercase tracking-wide text-foreground">{feature.label}</p>
              <p className="text-foreground-lighter">{feature.paragraph}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
