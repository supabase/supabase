import { MainNavItem, SidebarNavItem } from 'types/nav'

interface DocsConfig {
  mainNav?: MainNavItem[]
  sidebarNav: SidebarNavItem[]
}

export const docsConfig: DocsConfig = {
  // mainNav: [
  //   {
  //     title: 'Documentation',
  //     href: '/docs',
  //   },
  //   {
  //     title: 'Components',
  //     href: '/docs/components/accordion',
  //   },
  //   {
  //     title: 'Themes',
  //     href: '/themes',
  //   },
  //   {
  //     title: 'Examples',
  //     href: '/examples',
  //   },
  //   {
  //     title: 'Blocks',
  //     href: '/blocks',
  //   },
  // ],
  sidebarNav: [
    {
      title: 'Getting Started',
      items: [
        {
          title: 'Introduction',
          href: '/docs',
          items: [],
        },
        {
          title: 'Tailwind Classes',
          href: '/docs/tailwind-classes',
          items: [],
        },
        {
          title: 'Color Usage',
          href: '/docs/color-usage',
          items: [],
        },
        {
          title: 'Theming',
          href: '/docs/theming',
          items: [],
        },
        {
          title: 'Icons',
          href: '/docs/icons',
          items: [],
        },
        {
          title: 'Figma',
          href: '/docs/figma',
          items: [],
        },
        {
          title: 'Changelog',
          href: '/docs/changelog',
          items: [],
        },
      ],
    },
    {
      title: 'UI Patterns',
      items: [
        {
          title: 'Navigation',
          href: '/docs/ui-patterns/navigation',
          items: [],
        },
      ],
    },
    {
      title: 'Fragment Components',
      items: [
        {
          title: 'Introduction',
          href: '/docs/components/fragment-components',
          items: [],
        },
        {
          title: 'Admonition',
          href: '/docs/fragments/admonition',
          items: [],
        },
        {
          title: 'Assistant Chat',
          href: '/docs/fragments/assistant-chat',
          items: [],
        },
        {
          title: 'Modal',
          href: '/docs/fragments/modal',
          items: [],
        },
        {
          title: 'Text Confirm Dialog',
          href: '/docs/fragments/text-confirm-dialog',
          items: [],
        },
        {
          title: 'Info Tooltip',
          href: '/docs/fragments/info-tooltip',
          items: [],
        },
        {
          title: 'Inner Side Menu',
          href: '/docs/fragments/inner-side-menu',
          items: [],
        },
        {
          title: 'Data Input',
          href: '/docs/fragments/data-input',
          items: [],
        },
        {
          title: 'Form Item Layout',
          href: '/docs/fragments/form-item-layout',
          items: [],
        },
        {
          title: 'Multi Select',
          href: '/docs/fragments/multi-select',
          items: [],
        },
        {
          title: 'Filter Bar',
          href: '/docs/fragments/filter-bar',
          items: [],
        },
        {
          title: 'Logs Bar Chart',
          href: '/docs/fragments/logs-bar-chart',
          items: [],
        },
        {
          title: 'Table of Contents (TOC)',
          href: '/docs/fragments/toc',
          items: [],
        },
      ],
    },
    {
      title: 'Atom Components',
      items: [
        {
          title: 'Introduction',
          href: '/docs/components/atom-components',
          items: [],
        },
        {
          title: 'Accordion',
          href: '/docs/components/accordion',
          items: [],
        },
        {
          title: 'Alert',
          href: '/docs/components/alert',
          items: [],
        },
        {
          title: 'Alert Dialog',
          href: '/docs/components/alert-dialog',
          items: [],
        },
        {
          title: 'Aspect Ratio',
          href: '/docs/components/aspect-ratio',
          items: [],
        },
        {
          title: 'Avatar',
          href: '/docs/components/avatar',
          items: [],
        },
        {
          title: 'Badge',
          href: '/docs/components/badge',
          items: [],
        },
        {
          title: 'Breadcrumb',
          href: '/docs/components/breadcrumb',
          items: [],
          label: 'New',
        },
        {
          title: 'Button',
          href: '/docs/components/button',
          items: [],
        },
        {
          title: 'Calendar',
          href: '/docs/components/calendar',
          items: [],
        },
        {
          title: 'Card',
          href: '/docs/components/card',
          items: [],
        },
        {
          title: 'Carousel',
          href: '/docs/components/carousel',
          items: [],
        },
        {
          title: 'Chart',
          href: '/docs/components/chart',
          items: [],
        },
        {
          title: 'Checkbox',
          href: '/docs/components/checkbox',
          items: [],
        },
        {
          title: 'Collapsible',
          href: '/docs/components/collapsible',
          items: [],
        },
        {
          title: 'Combobox',
          href: '/docs/components/combobox',
          items: [],
        },
        {
          title: 'Command',
          href: '/docs/components/command',
          items: [],
        },
        {
          title: 'Command Menu (cmdk)',
          href: '/docs/components/commandmenu',
          items: [],
        },
        {
          title: 'Context Menu',
          href: '/docs/components/context-menu',
          items: [],
        },
        {
          title: 'Data Table',
          href: '/docs/components/data-table',
          items: [],
        },
        {
          title: 'Date Picker',
          href: '/docs/components/date-picker',
          items: [],
        },
        {
          title: 'Dialog',
          href: '/docs/components/dialog',
          items: [],
        },
        {
          title: 'Drawer',
          href: '/docs/components/drawer',
          items: [],
        },
        {
          title: 'Dropdown Menu',
          href: '/docs/components/dropdown-menu',
          items: [],
        },
        {
          title: 'Form',
          href: '/docs/components/form',
          items: [],
        },
        {
          title: 'Hover Card',
          href: '/docs/components/hover-card',
          items: [],
        },
        {
          title: 'Input',
          href: '/docs/components/input',
          items: [],
        },
        {
          title: 'Input OTP',
          href: '/docs/components/input-otp',
          items: [],
          label: 'New',
        },
        {
          title: 'Label',
          href: '/docs/components/label',
          items: [],
        },
        {
          title: 'Menubar',
          href: '/docs/components/menubar',
          items: [],
        },
        {
          title: 'NavMenu',
          href: '/docs/components/nav-menu',
          items: [],
        },
        {
          title: 'Navigation Menu',
          href: '/docs/components/navigation-menu',
          items: [],
        },
        {
          title: 'Pagination',
          href: '/docs/components/pagination',
          items: [],
        },
        {
          title: 'Popover',
          href: '/docs/components/popover',
          items: [],
        },
        {
          title: 'Progress',
          href: '/docs/components/progress',
          items: [],
        },
        {
          title: 'Radio Group',
          href: '/docs/components/radio-group',
          items: [],
        },
        {
          title: 'Radio Group Stacked',
          href: '/docs/components/radio-group-stacked',
          items: [],
        },
        {
          title: 'Radio Group Card',
          href: '/docs/components/radio-group-card',
          items: [],
        },
        {
          title: 'Resizable',
          href: '/docs/components/resizable',
          items: [],
        },
        {
          title: 'Scroll Area',
          href: '/docs/components/scroll-area',
          items: [],
        },
        {
          title: 'Select',
          href: '/docs/components/select',
          items: [],
        },
        {
          title: 'Separator',
          href: '/docs/components/separator',
          items: [],
        },
        {
          title: 'Sheet',
          href: '/docs/components/sheet',
          items: [],
        },
        {
          title: 'Skeleton',
          href: '/docs/components/skeleton',
          items: [],
        },
        {
          title: 'Slider',
          href: '/docs/components/slider',
          items: [],
        },
        {
          title: 'Sidebar',
          href: '/docs/components/sidebar',
          items: [],
        },
        {
          title: 'Sonner',
          href: '/docs/components/sonner',
          items: [],
        },
        {
          title: 'Switch',
          href: '/docs/components/switch',
          items: [],
        },
        {
          title: 'Table',
          href: '/docs/components/table',
          items: [],
        },
        {
          title: 'Tabs',
          href: '/docs/components/tabs',
          items: [],
        },
        {
          title: 'Textarea',
          href: '/docs/components/textarea',
          items: [],
        },
        {
          title: 'Toggle',
          href: '/docs/components/toggle',
          items: [],
        },
        {
          title: 'Toggle Group',
          href: '/docs/components/toggle-group',
          items: [],
        },
        {
          title: 'Tooltip',
          href: '/docs/components/tooltip',
          items: [],
        },
        {
          title: 'Tree View',
          href: '/docs/components/tree-view',
          items: [],
        },
        {
          title: 'Expanding Textarea',
          href: '/docs/components/expanding-textarea',
          items: [],
        },
      ],
    },
  ],
}
