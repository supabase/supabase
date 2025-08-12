export function SurveySectionBreak() {
  return (
    <div aria-hidden="true" className="border-y border-muted">
      <div className="max-w-[60rem] mx-auto md:border-x border-muted">
        <div
          className="h-14 md:h-18 lg:h-20 xl:h-24 bg-surface-400 dark:bg-surface-75"
          style={{
            maskImage: 'url("/survey/pattern-back.svg")',
            maskSize: '15px 15px',
            maskRepeat: 'repeat',
            maskPosition: 'top left',
          }}
        />
      </div>
    </div>
  )
}
