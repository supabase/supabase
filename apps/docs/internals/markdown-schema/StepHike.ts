type Props = Record<string, unknown>
type Ctx = { props: Props; children: string }

const Step = ({ props, children }: Ctx): string => {
  const step = String(props.step ?? '').trim()
  return step ? `${step}. ${children}` : children
}

const Details = ({ props, children }: Ctx): string => {
  return props.title ? `**${String(props.title).trim()}**\n\n${children}` : children
}

export const StepHike = {
  'StepHikeCompact.Step': Step,
  'StepHikeCompact.Details': Details,
}
