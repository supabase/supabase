export function SurveyRankedAnswersPair({
  rankedAnswersPair,
}: {
  rankedAnswersPair: Array<{ label: string; answers: string[] }>
}) {
  return (
    <div className="flex flex-col gap-8">
      {rankedAnswersPair.map((item, index) => (
        <div key={index} className="flex flex-row">
          <div className="flex flex-col gap-3">
            <ol className="flex flex-col gap-3">
              {item.answers.map((answer, answerIndex) => (
                <li key={answerIndex} className="font-mono text-brand">
                  #{answerIndex + 1}. {answer}
                </li>
              ))}
            </ol>
            <p className="text-foreground-light text-sm">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
