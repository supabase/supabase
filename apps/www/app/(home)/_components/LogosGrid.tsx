'use client'

const gridLogos = [
  'betashares',
  'bolt',
  'chatbase',
  'figma',
  'github',
  'goodtape',
  'gopuff',
  'gumloop',
  'happyteams',
  'humata',
  'langchain',
  'loops',
  'lovable',
  'markprompt',
  'mdn',
  'mobbin',
  'mozilla',
  'pika',
  'pwc',
  'resend',
  'soshi',
  'submagic',
  'tempo',
  'v0',
]

export function LogosGrid() {
  return (
    <div>
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 py-6">
        <p className="text-sm text-foreground-lighter">
          Trusted by fast-growing companies worldwide
        </p>
      </div>

      <div className="border-y border-border">
        <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 border-x border-border py-10">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-y-10 gap-x-6 opacity-70">
            {gridLogos.map((name) => (
              <div key={name} className="flex items-center justify-center h-10">
                <img
                  src={`/images/logos/publicity/${name}.svg`}
                  alt={name}
                  className="h-8 lg:h-12 w-auto"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
