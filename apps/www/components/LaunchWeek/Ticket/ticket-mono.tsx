export default function TicketMono({ golden = false }: { golden?: boolean }) {
  const frameColor = golden ? '#F2C94C' : '#252729'

  const perforationColor = golden ? 'var(--gold-accent)' : '#252729'

  return (
    <svg
      width="100%"
      height="auto"
      viewBox="0 0 650 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21 5C12.1634 5 5 12.1634 5 21V133.388C20.2981 135.789 32 149.028 32 165C32 180.972 20.2981 194.211 5 196.612V309C5 317.837 12.1634 325 21 325H629C637.837 325 645 317.837 645 309V196.612C629.702 194.211 618 180.972 618 165C618 149.028 629.702 135.789 645 133.388V21C645 12.1634 637.837 5 629 5H21Z"
        // fill="black"
      />
    </svg>
  )
}
