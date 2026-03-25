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
          className={`flex gap-6 md:gap-12 flex-1 ${index % 2 === 0 ? 'flex-col' : 'flex-col sm:flex-col-reverse'}`}
        >
          {/* Decorative progress bar */}
          <div
            aria-hidden="true"
            className={`flex ${index % 2 === 0 ? 'flex-row items-start' : 'flex-row-reverse items-start sm:items-end'}`}
          >
            {item.answers.map((answer, answerIndex) => (
              <div
                key={answerIndex}
                className={`${['h-20 md:h-32', 'h-12 md:h-20', 'h-4 md:h-8'][answerIndex] || 'hidden'} w-full pointer-events-none ${['bg-brand', 'bg-brand-500', 'bg-brand-300'][answerIndex] || 'bg-brand-300'}`}
                style={{
                  maskImage: 'url("/images/state-of-startups/pattern-checker.svg")',
                  maskSize: '4px',
                  maskRepeat: 'repeat',
                  maskPosition: 'top left',
                }}
              ></div>
            ))}
          </div>

          {/* Text content */}
          <div
            className={`px-6 py-8 flex ${index % 2 === 0 ? 'flex-col' : 'flex-col sm:flex-col-reverse'} gap-12`}
          >
            <ol className="flex flex-col gap-3">
              {item.answers.map((answer, answerIndex) => (
                <li key={answerIndex} className="flex flex-col gap-2">
                  <span className="text-sm font-mono text-brand">#{answerIndex + 1}</span>
                  <span
                    className={`${['text-2xl', 'text-lg', 'text-sm'][answerIndex] || 'text-lg'} text-foreground`}
                  >
                    {answer}
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-foreground-lighter text-sm font-mono uppercase tracking-wider">
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </aside>
  )
}
