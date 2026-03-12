import type { GoContentBlocksSection } from '../schemas'

export default function ContentBlocksSection({ section }: { section: GoContentBlocksSection }) {
  const gridCols = section.columns === '2' ? 'md:grid-cols-2' : 'md:grid-cols-3'

  return (
    <div>
      {section.heading && (
        <h2 className="text-foreground text-2xl text-center mb-8">{section.heading}</h2>
      )}
      <div className={`grid grid-cols-1 ${gridCols} gap-8`}>
        {section.blocks.map((block) => (
          <div key={block.heading}>
            {block.icon && <span className="text-2xl mb-2 block">{block.icon}</span>}
            <h3 className="text-foreground text-lg font-medium">{block.heading}</h3>
            <p className="text-foreground-lighter mt-2 text-sm">{block.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
