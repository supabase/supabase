// NOTE: When you export SVG from Figma, you must:
// - Update width and height as 100%
// - Change id to "mobile-..."
// - Change url(#) to url(#mobile-)
//   This is because if a page has two same IDs it will fail.
export default function TicketMonoMobile({ golden = false }: { golden?: boolean }) {
  const frameColor = golden ? '#F2C94C' : '#3fcf8e'

  const perforationColor = golden ? 'var(--gold-accent)' : '#252729'

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 330 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.9193e-06 540C3.40212e-06 551.046 8.95431 560 20 560L138 560C138 545.088 150.088 533 165 533C179.912 533 192 545.088 192 560L310 560C321.046 560 330 551.046 330 540L330 20C330 8.95427 321.046 -1.40334e-05 310 -1.35505e-05L192 -8.39259e-06C192 14.9117 179.912 27 165 27C150.088 27 138 14.9117 138 -6.03217e-06L20 -8.74228e-07C8.95428 -3.91405e-07 -2.41646e-05 8.95428 -2.36041e-05 20L2.9193e-06 540Z"
        fill={frameColor}
      /> */}
      {/* <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 539C5 547.837 12.1634 555 21 555L133.388 555C135.789 539.702 149.028 528 165 528C180.972 528 194.211 539.702 196.612 555L309 555C317.837 555 325 547.837 325 539L325 21C325 12.1634 317.837 4.99999 309 4.99999L196.612 4.99999C194.211 20.2981 180.972 32 165 32C149.028 32 135.789 20.2982 133.388 4.99999L21 5C12.1634 5 4.99998 12.1635 4.99998 21L5 539Z"
        fill="black"
      /> */}
      <path d="M326 446H5" stroke={perforationColor} strokeDasharray="6 6" />
    </svg>
  )
}
