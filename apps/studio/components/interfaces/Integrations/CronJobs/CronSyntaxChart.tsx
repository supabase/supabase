export default function CronSyntaxChart() {
  // Cron field labels in order
  const fields = [
    'minute (0 - 59)',
    'hour (0 - 23)',
    'day of month (1 - 31)',
    'month (1 - 12)',
    'day of week (0 - 7)',
  ];

  // Horizontal / vertical layout spacing
  const xGap = 28;
  const yStep = 18;

  // Bottom star-row Y position
  const yBottom = fields.length * yStep + 20;

  return (
    <div className="font-mono text-xs text-foreground-light p-2 overflow-x-auto">
      <svg
        width={fields.length * xGap + 160}  // Extra width so labels don’t get cut
        height={fields.length * yStep + 40} // Enough height for labels + stars
        aria-hidden="true"
      >
        {fields.map((label, i) => {
          // X position of each column
          const x = i * xGap + 10;

          // Y position of the text label for this row
          const yLabel = i * yStep + 10;

          return (
            <g key={i}>
              {/* L-shaped connector line */}
              <path
                d={`M ${x} ${yBottom - 12} L ${x} ${yLabel} L ${x + 12} ${yLabel}`}
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                className="opacity-60"
              />

              {/* Field label */}
              <text
                x={x + 16}
                y={yLabel}
                alignmentBaseline="middle"
                fill="currentColor"
              >
                {label}
              </text>

              {/* Star under each column */}
              <text
                x={x}
                y={yBottom}
                textAnchor="middle"
                fill="currentColor"
                className="text-sm font-bold"
              >
                *
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
