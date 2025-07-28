export function SurveyWordCloud({ answers, label }: { answers: string[]; label: string }) {
  return (
    <ol className="flex flex-col gap-3">
      {answers.map((answer, index) => (
        <li key={index} className="font-mono text-brand">
          {answer}
        </li>
      ))}
      <p className="text-foreground-light text-sm">{label}</p>
    </ol>
  )
}
