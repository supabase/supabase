interface ProductIcon {
  icon: string
  color?: 'black' | 'green'
}

function ProductIcon({ icon, color }: ProductIcon) {
  return (
    <div
      className={[
        'inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md',
        !color || color === 'black' ? 'bg-scale-1200 text-scale-100' : '',
        color && color === 'green' ? 'bg-brand-800 dark:bg-brand-600 text-brand-100' : '',
      ].join(' ')}
    >
      <svg
        className={[
          'h-5 w-5 stroke-white dark:stroke-black',
          color && color === 'green' ? 'dark:stroke-brand-900' : '',
        ].join(' ')}
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
