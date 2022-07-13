function HorizontalMenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={24}
      height={24}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      shapeRendering="geometricPrecision"
      color="var(--geist-foreground)"
      {...props}
    >
      <circle cx={12} cy={12} r={1} fill="currentColor" />
      <circle cx={19} cy={12} r={1} fill="currentColor" />
      <circle cx={5} cy={12} r={1} fill="currentColor" />
    </svg>
  );
}

export default HorizontalMenuIcon;
