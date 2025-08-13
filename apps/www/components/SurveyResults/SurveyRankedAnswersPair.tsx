export function SurveyRankedAnswersPair({
  rankedAnswersPair,
}: {
  rankedAnswersPair: Array<{ label: string; answers: string[] }>
}) {
  return (
    <aside className="flex flex-col sm:flex-row flex-wrap divide-x divide-y divide-muted divide-opacity-50">
      {rankedAnswersPair.map((item, index) => (
        <div
          key={index}
          className={`flex gap-3 flex-1 ${index % 2 === 0 ? 'flex-col' : 'flex-col sm:flex-col-reverse'}`}
        >
          {/* Decorative progress bar */}
          <div
            aria-hidden="true"
            className={`flex flex-row ${index % 2 === 0 ? 'items-start' : 'sm:items-end'}`}
          >
            {item.answers.map((answer, answerIndex) => (
              <div
                key={answerIndex}
                className={`h-${(answerIndex + 1) * 4} w-full pointer-events-none ${answerIndex === 0 ? 'bg-brand' : answerIndex === 1 ? 'bg-brand-500' : 'bg-brand-300'}`}
                style={{
                  maskImage: 'url("/images/state-of-startups/pattern-front.svg")',
                  maskSize: '14.5px 15px',
                  maskRepeat: 'repeat',
                  maskPosition: 'top left',
                }}
              ></div>
            ))}
          </div>

          {/* Text content */}
          <div
            className={`px-6 py-8 flex  ${index % 2 === 0 ? 'flex-col' : 'flex-col-reverse'}  gap-12`}
          >
            <ol className="flex flex-col gap-3">
              {item.answers.map((answer, answerIndex) => (
                <li key={answerIndex} className="flex flex-col gap-2">
                  <span className="text-sm font-mono text-brand">#{answerIndex + 1}</span>
                  <span className="text-lg text-foreground">{answer}</span>
                </li>
              ))}
            </ol>
            <p className="text-foreground-lighter text-sm font-mono uppercase tracking-wide">
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </aside>
  )
}
