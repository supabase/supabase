import type { GoMetricsSection } from '../schemas'

export default function MetricsSection({ section }: { section: GoMetricsSection }) {
  return (
    <div className="px-8">
      <div className="max-w-[80rem] mx-auto flex flex-wrap justify-center gap-8 sm:gap-16">
        {section.items.map((item, i) => (
          <div key={i} className="text-center">
            <p className="text-foreground-lighter text-xs tracking-widest uppercase mb-3">
              {item.label}
            </p>
            <p className="text-foreground text-3xl sm:text-5xl font-medium">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
