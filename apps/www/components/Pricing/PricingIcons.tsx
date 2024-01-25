export const Check = () => (
  <svg className="-ml-0.5" xmlns="http://www.w3.org/2000/svg" width="24" height="25" fill="none">
    <path
      fill="#3ECF8E"
      fillRule="evenodd"
      d="M12 21.212a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-.708-6.414 4.463-4.463-.707-.708-4.11 4.11-1.986-1.986-.707.707 2.34 2.34h.707Z"
      clipRule="evenodd"
    />
  </svg>
)

export const IconPricingIncludedCheck = (props: any) => (
  <span className="mx-auto">
    <Check />
    <span className="sr-only">Included in {props.plan}</span>
  </span>
)

export const IconPricingMinus = (props: any) => (
  <>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      fill="none"
      className="text-border-control"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M9 18A9 9 0 1 0 9 0a9 9 0 0 0 0 18ZM5.534 9.534h6.804v-1H5.534v1Z"
        clipRule="evenodd"
      />
    </svg>
    <span className="sr-only">Not included in {props.plan}</span>
  </>
)

export const IconPricingInfo = () => (
  <>
    <svg
      className="text-muted -ml-0.5"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm.724-11.97c0 .463-.328.764-.774.764-.436 0-.773-.3-.773-.764s.337-.783.774-.783c.445 0 .773.319.773.783Zm1.455 6.194H9.877v-.855h1.628v-2.956H9.877v-.828h2.674v3.784h1.628v.855Z"
        clipRule="evenodd"
      />
    </svg>
    <span className="sr-only">Info</span>
  </>
)
