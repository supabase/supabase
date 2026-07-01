/*
 * Globlal Variables
 *
 */

const defaults = {
  bg: {
    brand: {
      primary: 'bg-purple-600',
      secondary: 'bg-purple-200',
    },
  },
  text: {
    brand: 'text-purple-600',
    body: 'text-foreground-light',
    title: 'text-foreground',
  },
  border: {
    brand: 'border-brand-600',
    primary: 'border-default',
    secondary: 'border-secondary',
    alternative: 'border-alternative',
  },
  placeholder: 'placeholder-foreground-muted',
  focus: `
    outline-hidden
    focus:ring-current focus:ring-2
  `,
  'focus-visible': `
    outline-hidden
    transition-all
    outline-0
    focus-visible:outline-4
    focus-visible:outline-offset-1
  `,
  size: {
    // buttons, inputs, input labels use these sizes
    // text-base on mobile (below md) to avoid zoom on focus
    text: {
      tiny: 'text-xs',
      small: 'text-base md:text-sm leading-4',
      medium: 'text-base md:text-sm',
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

const default__padding_and_text = {
  tiny: `${defaults.size.text.tiny} ${defaults.size.padding.tiny}`,
  small: `${defaults.size.text.small} ${defaults.size.padding.small}`,
  medium: `${defaults.size.text.medium} ${defaults.size.padding.medium}`,
  large: `${defaults.size.text.large} ${defaults.size.padding.large}`,
  xlarge: `${defaults.size.text.xlarge} ${defaults.size.padding.xlarge}`,
}

/*
 * Main tailwind utility classes output
 *
 */

export default {
  /*
   * Card
   */

  card: {
    base: `
      bg-surface-100

      border
      ${defaults.border.primary}

      flex flex-col
      rounded-md shadow-lg overflow-hidden relative
    `,
    hoverable: 'transition hover:-translate-y-1 hover:shadow-2xl',
    head: `px-8 py-6 flex justify-between
    border-b
      ${defaults.border.primary} `,
    content: 'p-8',
  },

  /*
   *  Form Layout
   */

  form_layout: {
    container: 'grid gap-2',

    flex: {
      left: {
        base: 'flex flex-row gap-6',
        content: ``,
        labels: 'order-2',
        data_input: 'order-1',
      },
      right: {
        base: 'flex flex-row gap-6 justify-between',
        content: `order-last`,
        labels: '',
        data_input: 'text-right',
      },
    },

    responsive: 'md:grid md:grid-cols-12',
    non_responsive: 'grid grid-cols-12 gap-2',

    labels_horizontal_layout: 'flex flex-row space-x-2 justify-between col-span-12',
    labels_vertical_layout: 'flex flex-col space-y-2 col-span-4',

    data_input_horizontal_layout: 'col-span-12',

    non_box_data_input_spacing_vertical: 'my-3',
    non_box_data_input_spacing_horizontal: 'my-3 md:mt-0 mb-3',

    data_input_vertical_layout: 'col-span-8',

    data_input_vertical_layout__align_right: 'text-right',

    label: {
      base: 'block text-foreground-light',
      size: {
        ...defaults.size.text,
      },
    },
    label_optional: {
      base: 'text-foreground-lighter',
      size: {
        ...defaults.size.text,
      },
    },
    description: {
      base: 'mt-2 text-foreground-lighter leading-normal',
      size: {
        ...defaults.size.text,
      },
    },
    label_before: {
      base: 'text-foreground-lighter ',
      size: {
        ...defaults.size.text,
      },
    },
    label_after: {
      base: 'text-foreground-lighter',
      size: {
        ...defaults.size.text,
      },
    },
    error: {
      base: `
        text-red-900
        transition-all
        data-show:mt-2
        data-show:animate-slide-down-normal
        data-hide:animate-slide-up-normal
      `,
      size: {
        ...defaults.size.text,
      },
    },
    size: {
      tiny: 'text-xs',
      small: 'text-base md:text-sm leading-4',
      medium: 'text-base md:text-sm',
      large: 'text-base',
      xlarge: 'text-base',
    },
  },

  /*
   * modal
   */
  modal: {
    base: `
      relative
      bg-dash-sidebar
      my-4 max-w-screen
      border border-overlay
      rounded-md
      shadow-xl
      data-open:animate-overlay-show
      data-closed:animate-overlay-hide

    `,
    header: `
      bg-surface-200
      space-y-1 py-3 px-4 sm:px-5
      border-b border-overlay
      flex items-center justify-between
    `,
    footer: `
      flex justify-end gap-2
      py-3 px-5
      border-t border-overlay
    `,
    size: {
      tiny: `sm:align-middle sm:w-full sm:max-w-xs`,
      small: `sm:align-middle sm:w-full sm:max-w-sm`,
      medium: `sm:align-middle sm:w-full sm:max-w-lg`,
      large: `sm:align-middle sm:w-full md:max-w-xl`,
      xlarge: `sm:align-middle sm:w-full md:max-w-3xl`,
      xxlarge: `sm:align-middle sm:w-full max-w-screen md:max-w-6xl`,
      xxxlarge: `sm:align-middle sm:w-full md:max-w-7xl`,
    },
    overlay: `
      z-40
      fixed
      bg-alternative
      h-full w-full
      left-0
      top-0
      opacity-75
      data-closed:animate-fade-out-overlay-bg
      data-open:animate-fade-in-overlay-bg
    `,
    scroll_overlay: `
      z-40
      fixed
      inset-0
      grid
      place-items-center
      overflow-y-auto
      data-open:animate-overlay-show data-closed:animate-overlay-hide
    `,
    separator: `
      w-full
      h-px
      my-2
      bg-border-overlay
    `,
    content: `px-5`,
  },

  // listbox

  listbox: {
    base: `
      block
      box-border
      w-full
      rounded-md
      shadow-xs
      text-foreground
      border
      focus-visible:shadow-md
      ${defaults.focus}
      focus-visible:border-foreground-muted
      focus-visible:ring-background-control
      ${defaults.placeholder}
      indent-px
      transition-all
      bg-none
    `,
    container: 'relative',
    label: `truncate`,
    variants: {
      standard: `
        bg-control
        border border-control

        aria-expanded:border-foreground-muted
        aria-expanded:ring-border-muted
        aria-expanded:ring-2
        `,
      error: `
        bg-destructive-200
        border border-destructive-500
        focus:ring-destructive-400
        placeholder:text-destructive-400
       `,
    },
    options_container_animate: `
      transition
      data-open:animate-slide-down
      data-open:opacity-1
      data-closed:animate-slide-up
      data-closed:opacity-0
    `,
    options_container: `
      bg-overlay
      shadow-lg
      border border-solid
      border-overlay max-h-60
      rounded-md py-1 text-base
      sm:text-sm z-10 overflow-hidden overflow-y-scroll

      origin-dropdown
      data-open:animate-dropdown-content-show
      data-closed:animate-dropdown-content-hide
    `,
    with_icon: 'pl-2',
    addOnBefore: `
      w-full flex flex-row items-center space-x-3
    `,
    size: {
      ...default__padding_and_text,
    },
    disabled: `opacity-50`,
    actions_container: 'absolute inset-y-0 right-0 pl-3 pr-1 flex space-x-1 items-center',
    chevron_container: 'absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none',
    chevron: 'h-5 w-5 text-foreground-muted',
    option: `
      w-listbox
      transition cursor-pointer select-none relative py-2 pl-3 pr-9
      text-foreground-light
      text-sm
      hover:bg-border-overlay
      focus:bg-border-overlay
      focus:text-foreground
      border-none
      focus:outline-hidden
    `,
    option_active: `text-foreground bg-selection`,
    option_disabled: `cursor-not-allowed opacity-60`,
    option_inner: `flex items-center space-x-3`,
    option_check: `absolute inset-y-0 right-0 flex items-center pr-3 text-brand`,
    option_check_active: `text-brand`,
    option_check_icon: `h-5 w-5`,
  },

  inputErrorIcon: {
    base: `
      flex items-center
      right-3 pr-2 pl-2
      inset-y-0
      pointer-events-none
      text-red-900
    `,
  },
} as const
