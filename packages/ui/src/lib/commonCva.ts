import { cva, VariantProps } from 'class-variance-authority'

const defaults = {
  bg: {
    brand: {
      primary: 'bg-purple-600',
      secondary: 'bg-purple-200',
    },
  },
  text: {
    brand: 'text-purple-600',
    body: 'text-background',
    title: 'text-alternative',
  },
  border: {
    brand: 'border-brand-600',
    primary: 'border-strong',
    secondary: 'border-secondary',
    alternative: 'border-alternative',
  },
  placeholder: 'placeholder-border-stronger',
  focus: `
    outline-none
    focus:ring-current focus:ring-2
  `,
  'focus-visible': `
    outline-none
    transition-all
    outline-0
    focus-visible:outline-4
    focus-visible:outline-offset-1
  `,
  size: {
    // buttons, inputs, input labels use these sizes
    text: {
      tiny: 'text-xs',
      small: 'text-sm leading-4',
      medium: 'text-sm',
      large: 'text-base',
      xlarge: 'text-base',
    },
    // buttons, inputs, input labels use these sizes
    padding: {
      tiny: 'px-2.5 py-1',
      small: 'px-3 py-2',
      medium: 'px-4 py-2',
      large: 'px-4 py-2',
      xlarge: 'px-6 py-3',
    },
  },
  overlay: {
    base: `absolute inset-0 bg-background opacity-50`,
    container: `fixed inset-0 transition-opacity`,
  },
}

export const sizes = {
  tiny: `${defaults.size.text.tiny} ${defaults.size.padding.tiny}`,
  small: `${defaults.size.text.small} ${defaults.size.padding.small}`,
  medium: `${defaults.size.text.medium} ${defaults.size.padding.medium}`,
  large: `${defaults.size.text.large} ${defaults.size.padding.large}`,
  xlarge: `${defaults.size.text.xlarge} ${defaults.size.padding.xlarge}`,
}
export type SizeVariantProps = VariantProps<typeof sizeVariants>['size']
export const sizeVariants = cva('', {
  variants: {
    size: {
      ...sizes,
    },
  },
})
