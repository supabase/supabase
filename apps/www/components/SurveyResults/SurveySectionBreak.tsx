export function SurveySectionBreak() {
  return (
    <div aria-hidden="true" className="border-y border-muted">
      <div className="max-w-[60rem] mx-auto border-x border-muted">
        <div
          className="h-14 bg-surface-75"
          style={{
            maskImage: 'url("/survey/pattern-front.svg")',
            maskSize: '14.5px 15px',
            maskRepeat: 'repeat',
            maskPosition: 'top left',
          }}
        />
      </div>
    </div>
  )
}
