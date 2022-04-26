interface ProductIcon {
  icon: string
}

function ProductIcon({ icon }: ProductIcon) {
  return (
    <div className="bg-scale-1200 text-scale-100 inline-flex h-8 w-8 items-center justify-center rounded-md">
      <svg
        className="h-5 w-5 stroke-white dark:stroke-black"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
      </svg>
    </div>
  )
}

export default ProductIcon
