export const timingPhases = [
  "timing.dns",
  "timing.connection",
  "timing.tls",
  "timing.ttfb",
  "timing.transfer",
] as const;

export type TimingPhase = (typeof timingPhases)[number];

export function getTimingColor(timing: TimingPhase) {
  switch (timing) {
    case "timing.dns":
      return "bg-emerald-500";
    case "timing.connection":
      return "bg-cyan-500";
    case "timing.tls":
      return "bg-blue-500";
    case "timing.ttfb":
      return "bg-violet-500";
    case "timing.transfer":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
}

export function getTimingLabel(timing: TimingPhase) {
  switch (timing) {
    case "timing.dns":
      return "DNS";
    case "timing.connection":
      return "Connection";
    case "timing.tls":
      return "TLS";
    case "timing.ttfb":
      return "TTFB";
    case "timing.transfer":
      return "Transfer";
    default:
      return "Unknown";
  }
}

export function getTimingPercentage(
  timing: Record<TimingPhase, number>,
  latency: number
): Record<TimingPhase, number | string> {
  // const total = Object.values(timing).reduce((acc, curr) => acc + curr, 0);
  const percentage: Record<TimingPhase, number | string> = { ...timing };
  Object.entries(timing).forEach(([key, value]) => {
    const pValue = Math.round((value / latency) * 1000) / 1000;
    percentage[key as keyof typeof timing] = /^0\.00[0-9]+/.test(
      pValue.toString()
    )
      ? "<1%"
      : `${(pValue * 100).toFixed(1)}%`;
  });
  return percentage;
}
