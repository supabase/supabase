export const HIDDEN_PLACEHOLDER = '**** **** **** ****'
export const COLORS = [
  'brand',
  'scale',
  'tomato',
  'red',
  'crimson',
  'pink',
  'purple',
  'violet',
  'indigo',
  'blue',
  'green',
  'grass',
  'orange',
  'sky',
  'yellow',
  'amber',
  'gold',
  'gray',
  'slate',
]
export type AvailableColors =
  | 'brand'
  | 'brandAlt'
  | 'scale'
  | 'tomato'
  | 'red'
  | 'crimson'
  | 'pink'
  | 'purple'
  | 'violet'
  | 'indigo'
  | 'blue'
  | 'green'
  | 'grass'
  | 'orange'
  | 'sky'
  | 'yellow'
  | 'amber'
  | 'gold'
  | 'gray'
  | 'slate'

export const SIZE = {
  text: {
    tiny: 'text-xs',
    small: 'text-sm leading-4',
    medium: 'text-sm',
    large: 'text-base',
    xlarge: 'text-base',
  },
  padding: {
    tiny: 'px-2.5 py-1',
    small: 'px-3 py-2',
    medium: 'px-4 py-2',
    large: 'px-4 py-2',
    xlarge: 'px-6 py-3',
  },
  height: {
    tiny: 'h-[26px]',
    small: 'h-[34px]',
    medium: 'h-[38px]',
    large: 'h-[42px]',
    xlarge: 'h-[50px]',
  },
}

export const SIZE_VARIANTS = {
  tiny: `${SIZE.text['tiny']} ${SIZE.padding['tiny']} ${SIZE.height['tiny']}`,
  small: `${SIZE.text['small']} ${SIZE.padding['small']} ${SIZE.height['small']}`,
  medium: `${SIZE.text['medium']} ${SIZE.padding['medium']} ${SIZE.height['medium']}`,
  large: `${SIZE.text['large']} ${SIZE.padding['large']} ${SIZE.height['large']}`,
  xlarge: `${SIZE.text['xlarge']} ${SIZE.padding['xlarge']} ${SIZE.height['xlarge']}`,
}

export const SIZE_VARIANTS_DEFAULT = 'small'
