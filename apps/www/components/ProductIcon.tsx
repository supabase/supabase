type Color = 'black' | 'gray' | 'green' | 'alt'

interface ProductIcon {
  icon: string
  color?: Color
}

function ProductIcon({ icon, color }: ProductIcon) {
  const handleColor = (color: Color) => {
    switch (color) {
      case 'green':
        return {
          container: 'bg-brand-600 text-brand-100',
          svg: 'stroke-brand',
        }
      case 'alt':
        return {
          container: 'bg-brand-200 text-brand',
          svg: 'stroke-brand',
        }
      case 'gray':
        return {
          container: 'bg- text-brand',
          svg: 'stroke-brand',
        }
      case 'black':
      default:
        return {
          container: 'bg-foreground text-background-alternative',
          svg: 'stroke-background',
        }
    }
  }

  return (
    <div
      className={[
        'inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md',
        !color || color === 'black' ? 'bg-foreground text-background-alternative' : '',
        color && color === 'gray' ? 'bg-border-strong text-foreground-light' : '',
        color && color === 'green' ? 'bg-brand text-brand-100' : '',
        color && color === 'alt' ? 'bg-alternative text-brand' : '',
        // color && color === 'alt' ? 'bg-surface-300 text-brand' : '',
      ].join(' ')}
    >
      <svg
        className={[
          'h-5 w-5',
          !color || color === 'black' ? 'stroke-background' : '',
          color && color === 'gray' ? 'stroke-foreground-light' : '',
          color && color === 'green' ? 'stroke-brand-200' : '',
          color && color === 'alt' ? 'stroke-brand' : '',
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
