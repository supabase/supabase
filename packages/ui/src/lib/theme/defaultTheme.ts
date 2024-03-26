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

const utils = {
  border: {
    hover: 'border-opacity-50 hover:border-opacity-100',
    fix: 'border-opacity-100',
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
 * Animations
 *
 */

const default___animations = {
  accordion: {
    enter: 'transition-max-height ease-in-out duration-700 overflow-hidden',
    enterFrom: 'max-h-0',
    enterTo: 'max-h-screen',
    leave: 'transition-max-height ease-in-out duration-300 overflow-hidden',
    leaveFrom: 'max-h-screen',
    leaveTo: 'max-h-0',
  },
}

/*
 * Main tailwind utility classes output
 *
 */

export default {
  /*
   * Accordion
   *
   */

  accordion: {
    variants: {
      default: {
        base: `
          flex flex-col
          space-y-3
        `,
        container: `
          group
          first:rounded-tl-md first:rounded-tr-md
          last:rounded-bl-md last:rounded-br-md
          overflow-hidden
          will-change-transform
        `,
        trigger: `
          flex flex-row
          gap-3
          items-center
          w-full
          text-left
          cursor-pointer

          outline-none
          focus-visible:ring-1
          focus-visible:z-10
          ring-foreground-light
        `,
        content: `
          data-open:animate-slide-down
          data-closed:animate-slide-up
        `,
        panel: `
          py-3
        `,
      },
      bordered: {
        base: `
          flex flex-col
          -space-y-px
        `,
        container: `
          group
          border
          border-default

          first:rounded-tl-md first:rounded-tr-md
          last:rounded-bl-md last:rounded-br-md
        `,
        trigger: `
          flex flex-row
          items-center
          px-6 py-4
          w-full
          text-left
          cursor-pointer

          font-medium
          text-base
          bg-transparent

          outline-none
          focus-visible:ring-1
          focus-visible:z-10
          ring-foreground-light

          transition-colors
          hover:bg-background

          overflow-hidden

          group-first:rounded-tl-md group-first:rounded-tr-md
          group-last:rounded-bl-md group-last:rounded-br-md
        `,
        content: `
          data-open:animate-slide-down
          data-closed:animate-slide-up
        `,
        panel: `
          px-6 py-3
          border-t border-strong
          bg-background
        `,
      },
    },
    justified: `justify-between`,
    chevron: {
      base: `
        text-foreground-lighter
        rotate-0
        group-state-open:rotate-180
        group-data-[state=open]:rotate-180
        ease-&lsqb;cubic-bezier(0.87,_0,_0.13,_1)&rsqb;
        transition-transform duration-300
        duration-200
      `,
      align: {
        left: 'order-first',
        right: 'order-last',
      },
    },
    animate: {
      ...default___animations.accordion,
    },
  },

  /*
   * Badge
   *
   */

  badge: {
    base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-opacity-10',
    size: {
      large: 'px-3 py-0.5 rounded-full text-sm',
    },
    dot: '-ml-0.5 mr-1.5 h-2 w-2 rounded-full',
    color: {
      brand: 'bg-brand-500 text-brand-600 border border-brand-500',
      brandAlt: 'bg-brand bg-opacity-100 text-background border border-brand',
      scale: 'bg-background text-foreground-light border border-strong',
      tomato: `bg-tomato-200 text-tomato-1100 border border-tomato-700`,
      red: `bg-red-200 text-red-1100 border border-red-700`,
      crimson: `bg-crimson-200 text-crimson-1100 border border-crimson-700`,
      pink: `bg-pink-200 text-pink-1100 border border-pink-700`,
      purple: `bg-purple-200 text-purple-1100 border border-purple-700`,
      violet: `bg-violet-200 text-violet-1100 border border-violet-700`,
      indigo: `bg-indigo-200 text-indigo-1100 border border-indigo-700`,
      blue: `bg-blue-200 text-blue-1100 border border-blue-700`,
      green: `bg-opacity-10 bg-brand-500 text-brand-600 border border-brand-500`,
      grass: `bg-grass-200 text-grass-1100 border border-grass-700`,
      orange: `bg-orange-200 text-orange-1100 border border-orange-700`,
      yellow: `bg-yellow-200 text-yellow-1100 border border-yellow-700`,
      amber: `bg-amber-200 text-amber-1100 border border-amber-700`,
      gold: `bg-gold-200 text-gold-1100 border border-gold-700`,
      gray: `bg-gray-200 text-gray-1100 border border-gray-700`,
      slate: `bg-slate-200 text-slate-1100 border border-slate-700`,
    },
  },

  /*
   * Alert
   *
   */

  alert: {
    base: `
      relative rounded-md border py-4 px-6
      flex space-x-4 items-start
    `,
    header: 'block text-sm font-normal mb-1',
    description: `text-xs`,
    variant: {
      danger: {
        base: `bg-red-200 btext-red-1200 border-red-700`,
        icon: `text-red-900`,
        header: `text-red-1200`,
        description: `text-red-1100`,
      },
      warning: {
        base: `bg-amber-200 border-amber-700`,
        icon: `text-amber-900`,
        header: `text-amber-1200`,
        description: `text-amber-1100`,
      },
      info: {
        base: `bg-alternative border-alternative`,
        icon: `text-foreground-lighter`,
        header: `text-foreground`,
        description: `text-foreground-light`,
      },
      success: {
        base: `bg-brand-300 border-brand-400`,
        icon: `text-brand`,
        header: `text-brand-600`,
        description: `text-brand-600`,
      },
      neutral: {
        base: `bg-surface-100 border-default`,
        icon: `text-foreground-muted`,
        header: `text-foreground`,
        description: `text-foreground-light`,
      },
    },
    close: `
      absolute
      right-6 top-4
      p-0 m-0
      text-foreground-muted
      cursor-pointer transition ease-in-out
      bg-transparent border-transparent focus:outline-none
      opacity-50 hover:opacity-100`,
  },

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
   * Tabs
   */

  tabs: {
    base: `w-full justify-between space-y-4`,
    underlined: {
      list: `
        flex items-center border-b
        ${defaults.border.secondary}
        `,
      base: `
        relative
        cursor-pointer
        text-foreground-lighter
        flex
        items-center
        space-x-2
        text-center
        transition
        focus:outline-none
        focus-visible:ring
        focus-visible:ring-foreground-muted
        focus-visible:border-foreground-muted
      `,
      inactive: `
        hover:text-foreground
      `,
      active: `
        !text-foreground
        border-b-2 border-foreground
      `,
    },
    pills: {
      list: 'flex space-x-1',
      base: `
        relative
        cursor-pointer
        flex
        items-center
        space-x-2
        text-center
        transition
        shadow-sm
        rounded
        border
        focus:outline-none
        focus-visible:ring
        focus-visible:ring-foreground-muted
        focus-visible:border-foreground-muted
        `,
      inactive: `
        bg-background
        border-strong hover:border-foreground-muted
        text-foreground-muted hover:text-foreground
      `,
      active: `
        bg-selection
        text-foreground
        border-stronger
      `,
    },
    'rounded-pills': {
      list: 'flex flex-wrap gap-2',
      base: `
        relative
        cursor-pointer
        flex
        items-center
        space-x-2
        text-center
        transition
        shadow-sm
        rounded-full
        focus:outline-none
        focus-visible:ring
        focus-visible:ring-foreground-muted
        focus-visible:border-foreground-muted
        `,
      inactive: `
        bg-surface-200 hover:bg-surface-300
        hover:border-foreground-lighter
        text-foreground-lighter hover:text-foreground
      `,
      active: `
        bg-foreground
        text-background
        border-foreground
      `,
    },
    block: 'w-full flex items-center justify-center',
    size: {
      ...default__padding_and_text,
    },
    scrollable: `overflow-auto whitespace-nowrap no-scrollbar mask-fadeout-right`,
    wrappable: `flex-wrap`,
    content: `focus:outline-none transition-height`,
  },

  /*
   * Input
   */

  input: {
    base: `
      block
      box-border
      w-full
      rounded-md
      shadow-sm
      transition-all
      text-foreground
      border
      focus-visible:shadow-md
      ${defaults.focus}
      focus-visible:border-foreground-muted
      focus-visible:ring-background-control
      ${defaults.placeholder}
      group
    `,
    variants: {
      standard: `
        bg-foreground/[.026]
        border border-control
        `,
      error: `
        bg-destructive-200
        border border-destructive-500
        focus:ring-destructive-400
        placeholder:text-destructive-400
       `,
    },
    container: 'relative',
    with_icon: 'pl-10',
    size: {
      ...default__padding_and_text,
    },
    disabled: 'opacity-50',
    actions_container: 'absolute inset-y-0 right-0 pl-3 pr-1 flex space-x-1 items-center',
    textarea_actions_container: 'absolute inset-y-1.5 right-0 pl-3 pr-1 flex space-x-1 items-start',
    textarea_actions_container_items: 'flex items-center',
  },

  /*
   * Select
   */

  select: {
    base: `
      block
      box-border
      w-full
      rounded-md
      shadow-sm
      transition-all
      text-foreground
      border
      focus-visible:shadow-md
      ${defaults.focus}
      focus-visible:border-foreground-muted
      focus-visible:ring-background-control
      ${defaults.placeholder}

      appearance-none
      bg-none
    `,
    variants: {
      standard: `
        bg-background
        border border-strong
        `,
      error: `
        bg-destructive-200
        border border-destructive-500
        focus:ring-destructive-400
        placeholder:text-destructive-400
       `,
    },
    container: 'relative',
    with_icon: 'pl-10',
    size: {
      ...default__padding_and_text,
    },
    disabled: 'opacity-50',
    actions_container: 'absolute inset-y-0 right-0 pl-3 pr-1 mr-5 flex items-center',
    chevron_container: 'absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none',
    chevron: 'h-5 w-5 text-foreground-lighter',
  },

  /*
   * Input Number
   */

  inputNumber: {
    base: `
      block
      box-border
      w-full
      rounded-md
      shadow-sm
      transition-all
      text-foreground
      border
      focus-visible:shadow-md
      ${defaults.focus}
      focus-visible:border-foreground-muted
      focus-visible:ring-background-control
      ${defaults.placeholder}

      appearance-none
      bg-none
    `,
    variants: {
      standard: `
        bg-control
        border border-strong
      `,
      error: `
        bg-destructive-200
        border border-destructive-500
        focus:ring-destructive-400
        placeholder:text-destructive-400
       `,
    },
    disabled: 'opacity-50',
    container: 'relative',
    with_icon: 'pl-10',
    size: {
      ...default__padding_and_text,
    },
    actions_container: 'absolute inset-y-0 right-0 pl-3 pr-1 flex space-x-1 items-center',
  },

  /*
   *  Checkbox
   *
   *
   * This Checkbox requires a plugin in your config:

    ```
    // tailwind.config.js
    module.exports = {
      // ...
      plugins: [
        // ...
        require('@tailwindcss/forms'),
      ],
    }
    ```
   *
   *
  */

  checkbox: {
    base: `
      bg-transparent
      ${defaults.focus}
      focus:ring-border-muted
      text-brand
      border-strong
      shadow-sm
      rounded
      cursor-pointer
    `,
    container: `flex cursor-pointer leading-none`,
    size: {
      tiny: `h-3 w-3 mt-1 mr-3`,
      small: `h-3.5 w-3.5 mt-0.5 mr-3.5`,
      medium: `h-4 w-4 mt-0.5 mr-3.5`,
      large: `h-5 w-5 mt-0.5 mr-4`,
      xlarge: `h-5 w-5 mt-0.5 mr-4`,
    },
    disabled: 'opacity-50',
    label: {
      base: `text-foreground-light cursor-pointer`,
      ...defaults.size.text,
    },
    label_before: {
      base: 'text-border',
      ...defaults.size.text,
    },
    label_after: {
      base: 'text-border',
      ...defaults.size.text,
    },
    description: {
      base: `text-foreground-lighter`,
      ...defaults.size.text,
    },
    group: `space-y-3`,
  },

  /*
   *  Radio
   *
   *
   * This Radio requires a plugin in your config:

    ```
    // tailwind.config.js
    module.exports = {
      // ...
      plugins: [
        // ...
        require('@tailwindcss/forms'),
      ],
    }
    ```
   *
   *
  */

  radio: {
    base: `
      absolute
      ${defaults.focus}
      focus:ring-brand-400
      border-strong

      text-brand
      shadow-sm
      cursor-pointer
      peer

      bg-surface-100
    `,
    hidden: `absolute opacity-0`,
    size: {
      tiny: `h-3 w-3`,
      small: `h-3.5 w-3.5`,
      medium: `h-4 w-4`,
      large: `h-5 w-5`,
      xlarge: `h-5 w-5`,
    },
    variants: {
      cards: {
        container: {
          base: `relative cursor-pointer flex`,
          align: {
            vertical: 'flex flex-col space-y-1',
            horizontal: 'flex flex-row space-x-2',
          },
        },
        group: `-space-y-px shadow-sm`,
        base: `
          transition
          border
          first:rounded-tl-md first:rounded-tr-md
          last:rounded-bl-md last:rounded-br-md
        `,
        size: {
          tiny: `px-5 py-3`,
          small: `px-6 py-4`,
          medium: `px-6 py-4`,
          large: `px-8 p-4`,
          xlarge: `px-8 p-4`,
        },
        inactive: `
          bg-surface-200
          border-alternative
          hover:border-strong
          hover:bg-surface-300
        `,
        active: `
          bg-selection z-10
          border-stronger
          border-1
        `,
        radio_offset: 'left-4',
      },

      'stacked-cards': {
        container: {
          base: `relative cursor-pointer flex items-center justify-between`,
          align: {
            vertical: 'flex flex-col space-y-1',
            horizontal: 'flex flex-row space-x-2',
          },
        },
        group: `space-y-3`,
        base: `
          transition
          rounded-md
          border
          shadow-sm
        `,
        size: {
          tiny: `px-5 py-3`,
          small: `px-6 py-4`,
          medium: `px-6 py-4`,
          large: `px-8 p-4`,
          xlarge: `px-8 p-4`,
        },
        inactive: `
          bg-surface-200
          border-alternative
          hover:border-strong
          hover:bg-surface-300
        `,
        active: `
          bg-selection z-10
          border-stronger
          border-1
        `,
        radio_offset: 'left-4',
      },

      'small-cards': {
        container: {
          base: `relative cursor-pointer flex`,
          align: {
            vertical: 'flex flex-col space-y-1 items-center justify-center',
            horizontal: 'flex flex-row space-x-2',
          },
        },
        group: `flex flex-row gap-3`,
        base: `
          transition
          border
          rounded-lg
          grow
          items-center
          flex-wrap
          justify-center
          shadow-sm
        `,
        size: {
          tiny: `px-5 py-3`,
          small: `px-6 py-4`,
          medium: `px-6 py-4`,
          large: `px-8 p-4`,
          xlarge: `px-8 p-4`,
        },
        inactive: `
          bg-surface-200
          border-alternative
          hover:border-strong
          hover:bg-surface-300
        `,
        active: `
          bg-selection z-10
          border-stronger border-1
        `,
        radio_offset: 'left-4',
      },

      'large-cards': {
        container: {
          base: `relative cursor-pointer flex`,
          align: {
            vertical: 'flex flex-col space-y-1',
            horizontal: 'flex flex-row space-x-2',
          },
        },
        group: `grid grid-cols-12 gap-3`,
        base: `
          transition
          border border-stronger
          shadow-sm
          rounded-lg
          grow
        `,
        size: {
          tiny: `px-5 py-3`,
          small: `px-6 py-4`,
          medium: `px-6 py-4`,
          large: `px-8 p-4`,
          xlarge: `px-8 p-4`,
        },
        inactive: `
          bg-surface-200
          border-alternative
          hover:border-strong
          hover:bg-surface-300
        `,
        active: `
          bg-selection z-10
          border-strong
          border-1
        `,
        radio_offset: 'left-4',
      },

      list: {
        container: {
          base: `relative cursor-pointer flex`,
          size: {
            tiny: `pl-6`,
            small: `pl-6`,
            medium: `pl-7`,
            large: `pl-10`,
            xlarge: `pl-10`,
          },
          align: {
            vertical: 'flex flex-col space-y-1',
            horizontal: 'flex flex-row space-x-2',
          },
        },
        group: `space-y-4`,
        base: ``,
        size: {
          tiny: `0`,
          small: `0`,
          medium: `0`,
          large: `0`,
          xlarge: `0`,
        },
        active: ``,
        radio_offset: 'left-0',
      },
    },
    label: {
      base: `text-foreground-light cursor-pointer`,
      ...defaults.size.text,
    },
    label_before: {
      base: 'text-border',
      ...defaults.size.text,
    },
    label_after: {
      base: 'text-border',
      ...defaults.size.text,
    },
    description: {
      base: `text-foreground-lighter`,
      ...defaults.size.text,
    },
    optionalLabel: {
      base: `text-foreground-lighter`,
      ...defaults.size.text,
    },
    disabled: `opacity-50 cursor-auto border-dashed`,
  },

  sidepanel: {
    base: `
      z-40
      bg-overlay
      flex flex-col
      fixed
      inset-y-0
      h-full lg:h-screen
      border-l border-overlay
      shadow-xl
    `,
    header: `
      space-y-1 py-4 px-4 bg-overlay sm:px-6
      border-b border-overlay
    `,
    contents: `
      relative
      flex-1
      overflow-y-auto
    `,
    content: `
      px-4 sm:px-6
    `,
    footer: `
      flex justify-end gap-2
      p-4 bg-overlay
      border-t border-overlay
    `,
    size: {
      medium: `w-screen max-w-md h-full`,
      large: `w-screen max-w-2xl h-full`,
      xlarge: `w-screen max-w-3xl h-full`,
      xxlarge: `w-screen max-w-4xl h-full`,
      xxxlarge: `w-screen max-w-5xl h-full`,
      xxxxlarge: `w-screen max-w-6xl h-full`,
    },
    align: {
      left: `
        left-0
        data-open:animate-panel-slide-left-out
        data-closed:animate-panel-slide-left-in
      `,
      right: `
        right-0
        data-open:animate-panel-slide-right-out
        data-closed:animate-panel-slide-right-in
      `,
    },
    separator: `
      w-full
      h-px
      my-2
      bg-border
    `,
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
    // this is to reset the button
    // it is advised not to change this
    trigger: `
      border-none bg-transparent p-0 focus:ring-0
    `,
  },

  /*
   *  Toggle
   */

  toggle: {
    base: `
      p-0 relative
      inline-flex flex-shrink-0
      border-2 border-transparent
      rounded-full
      cursor-pointer
      transition-colors ease-in-out duration-200
      ${defaults.focus}
      focus:!ring-border
      bg-foreground-muted/40

      hover:bg-foreground-muted/60
    `,
    active: `
      !bg-brand
      !hover:bg-brand
    `,
    handle_container: {
      tiny: 'h-4 w-7',
      small: 'h-6 w-11',
      medium: 'h-6 w-11',
      large: 'h-7 w-12',
      xlarge: 'h-7 w-12',
    },
    handle: {
      base: `
        inline-block h-5 w-5
        rounded-full
        bg-white
        shadow ring-0
        transition
        ease-in-out duration-200
      `,
      tiny: '!h-3 !w-3',
      small: '!h-5 !w-5',
      medium: '!h-5 !w-5',
      large: '!h-6 !w-6',
      xlarge: '!h-6 !w-6',
    },
    handle_active: {
      tiny: ' translate-x-3 dark:bg-white',
      small: 'translate-x-5 dark:bg-white',
      medium: 'translate-x-5 dark:bg-white',
      large: 'translate-x-5 dark:bg-white',
      xlarge: 'translate-x-5 dark:bg-white',
    },
    disabled: 'opacity-75 cursor-not-allowed',
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
      small: 'text-sm leading-4',
      medium: 'text-sm',
      large: 'text-base',
      xlarge: 'text-base',
    },
  },

  /*
   *  Popover
   */

  popover: {
    trigger: `
      flex
      border-none
      rounded
      bg-transparent
      p-0
      outline-none
      outline-offset-1
      transition-all
      focus:outline-4
      focus:outline-border-control
    `,
    content: `
      z-40
      bg-overlay
      border border-overlay
      rounded
      shadow-lg
      data-open:animate-dropdown-content-show
      data-closed:animate-dropdown-content-hide
      min-w-fit

      origin-popover
      data-open:animate-dropdown-content-show
      data-closed:animate-dropdown-content-hide
    `,
    size: {
      tiny: `w-40`,
      small: `w-48`,
      medium: `w-64`,
      large: `w-80`,
      xlarge: `w-96`,
      content: `w-auto`,
    },
    header: `
      bg-surface-200
      space-y-1 py-1.5 px-3
      border-b border-overlay
    `,
    footer: `
      bg-surface-200
      py-1.5 px-3
      border-t border-overlay
    `,
    close: `
      transition
      text-foreground-lighter
    `,
    separator: `
      w-full
      h-px
      my-2
      bg-border-overlay
    `,
  },

  /*
   * Menu
   */

  menu: {
    item: {
      base: `
        cursor-pointer
        flex space-x-3 items-center
        outline-none
        focus-visible:ring-1 ring-foreground-muted focus-visible:z-10
        group
      `,
      content: {
        base: `transition truncate text-sm w-full`,
        normal: `text-foreground-light group-hover:text-foreground`,
        active: `text-foreground font-semibold`,
      },
      icon: {
        base: `transition truncate text-sm`,
        normal: `text-foreground-lighter group-hover:text-foreground-light`,
        active: `text-foreground`,
      },
      variants: {
        text: {
          base: `
            py-1
          `,
          normal: `
            font-normal
            border-default
            group-hover:border-foreground-muted`,
          active: `
            font-semibold
            text-foreground-muted
            z-10
          `,
        },
        border: {
          base: `
            px-4 py-1
          `,
          normal: `
            border-l
            font-normal
            border-default
            group-hover:border-foreground-muted`,
          active: `
            font-semibold

            text-foreground-muted
            z-10

            border-l
            border-brand
            group-hover:border-brand
          `,
          rounded: `rounded-md`,
        },
        pills: {
          base: `
            px-3 py-1
          `,
          normal: `
            font-normal
            border-default
            group-hover:border-foreground-muted`,
          active: `
            font-semibold
            bg-surface-200
            text-foreground-lighter
            z-10

            rounded-md
          `,
        },
      },
    },
    group: {
      base: `
        flex space-x-3
        mb-2
        font-normal
      `,
      icon: `text-foreground-lighter`,
      content: `text-sm text-foreground-lighter w-full`,
      variants: {
        text: ``,
        pills: `px-3`,
        border: ``,
      },
    },
  },

  /*
   * modal
   */
  modal: {
    base: `
      relative
      bg-overlay
      my-4
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
      large: `sm:align-middle sm:w-full max-w-xl`,
      xlarge: `sm:align-middle sm:w-full max-w-3xl`,
      xxlarge: `sm:align-middle sm:w-full max-w-6xl`,
      xxxlarge: `sm:align-middle sm:w-full max-w-7xl`,
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
      shadow-sm
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
      text-foreground-muted
      text-sm
      hover:bg-border-overlay
      focus:bg-border-overlay
      focus:text-foreground
      border-none
      focus:outline-none
    `,
    option_active: `text-foreground bg-selection`,
    option_disabled: `cursor-not-allowed opacity-50`,
    option_inner: `flex items-center space-x-3`,
    option_check: `absolute inset-y-0 right-0 flex items-center pr-3 text-brand`,
    option_check_active: `text-brand`,
    option_check_icon: `h-5 w-5`,
  },

  collapsible: {
    content: `
      data-open:animate-slide-down-normal
      data-closed:animate-slide-up-normal
    `,
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

  inputIconContainer: {
    base: `
    absolute inset-y-0
    left-0 pl-3 flex
    items-center pointer-events-none
    text-foreground-light
    [&_svg]:stroke-[1.5]
    `,
    size: {
      tiny: '[&_svg]:h-[14px] [&_svg]:w-[14px]',
      small: '[&_svg]:h-[18px] [&_svg]:w-[18px]',
      medium: '[&_svg]:h-[20px] [&_svg]:w-[20px]',
      large: '[&_svg]:h-[20px] [&_svg]:w-[20px]',
      xlarge: '[&_svg]:h-[24px] [&_svg]:w-[24px]',
      xxlarge: '[&_svg]:h-[30px] [&_svg]:w-[30px]',
      xxxlarge: '[&_svg]:h-[42px] [&_svg]:w-[42px]',
    },
  },

  // Icon

  icon: {
    container: `flex-shrink-0 flex items-center justify-center rounded-full p-3`,
  },

  loading: {
    base: `relative`,
    content: {
      base: `transition-opacity duration-300`,
      active: `opacity-40`,
    },
    spinner: `
      absolute
      text-brand animate-spin
      inset-0
      m-auto
    `,
  },
}
