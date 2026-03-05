import { MainNavItem, SidebarNavItem } from '@/types/nav'

interface DocsConfig {
  mainNav?: MainNavItem[]
  sidebarNav: SidebarNavItem[]
}

export const docsConfig: DocsConfig = {
  sidebarNav: [
    {
      title: 'Getting Started',
      sortOrder: 'alphabetical',
      items: [
        {
          title: 'Introduction',
          href: '/docs',
          priority: true,
          items: [],
        },
        {
          title: 'Accessibility',
          href: '/docs/accessibility',
          items: [],
        },

        {
          title: 'Color Usage',
          href: '/docs/color-usage',
          items: [],
        },
        {
          title: 'Copywriting',
          href: '/docs/copywriting',
          items: [],
        },
        {
          title: 'Icons',
          href: '/docs/icons',
          items: [],
        },
        {
          title: 'Tailwind Classes',
          href: '/docs/tailwind-classes',
          items: [],
        },
        {
          title: 'Theming',
          href: '/docs/theming',
          items: [],
        },
        {
          title: 'Typography',
          href: '/docs/typography',
          items: [],
        },
      ],
    },
    {
      title: 'UI Patterns',
      sortOrder: 'alphabetical',
      items: [
        {
          title: 'Introduction',
          href: '/docs/ui-patterns/introduction',
          items: [],
          priority: true,
        },
        {
          title: 'Charts',
          href: '/docs/ui-patterns/charts',
          items: [],
        },
        {
          title: 'Empty States',
          href: '/docs/ui-patterns/empty-states',
          items: [],
        },
        {
          title: 'Forms',
          href: '/docs/ui-patterns/forms',
          items: [],
        },
        {
          title: 'Layout',
          href: '/docs/ui-patterns/layout',
          items: [],
        },
        {
          href: '/docs/ui-patterns/modality',
          title: 'Modality',
          items: [],
        },
        {
          href: '/docs/ui-patterns/navigation',
          title: 'Navigation',
          items: [],
        },
        {
          title: 'Tables',
          href: '/docs/ui-patterns/tables',
          items: [],
        },
      ],
    },
    {
      title: 'Fragment Components',
      sortOrder: 'alphabetical',
      items: [
        {
          title: 'Introduction',
          href: '/docs/fragments/introduction',
          items: [],
          priority: true,
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
          title: 'Empty State Presentational',
          href: '/docs/fragments/empty-state-presentational',
          items: [],
        },
        {
          title: 'Modal',
          href: '/docs/fragments/modal',
          items: [],
        },
        {
          title: 'Page Container',
          href: '/docs/fragments/page-container',
          items: [],
        },
        {
          title: 'Page Header',
          href: '/docs/fragments/page-header',
          items: [],
        },
        {
          title: 'Page Section',
          href: '/docs/fragments/page-section',
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
          title: 'Metric Card',
          href: '/docs/fragments/metric-card',
          items: [],
        },
        {
          title: 'Table of Contents (TOC)',
          href: '/docs/fragments/toc',
          items: [],
        },
        {
          title: 'Confirmation Modal',
          href: '/docs/fragments/confirmation-modal',
          items: [],
        },
      ],
    },
    {
      title: 'Atom Components',
      sortOrder: 'alphabetical',
      items: [
        {
          title: 'Introduction',
          href: '/docs/components/introduction',
          items: [],
          priority: true,
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
          title: 'Field',
          href: '/docs/components/field',
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
          title: 'Mermaid',
          href: '/docs/components/mermaid',
          items: [],
          label: 'New',
        },
        {
          title: 'Menubar',
          href: '/docs/components/menubar',
          items: [],
        },
        {
          title: 'Nav Menu',
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
