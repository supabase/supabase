import createSupabaseIcon from '../createSupabaseIcon';

/**
 * @component @name ClickHouse
 * @description Supabase SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyAzVjIxTTcuNSAzVjIxTTEyIDNWMjFNMTYuNSAzVjIxTTIxIDEwVjE0IiBzdHJva2U9IiMwMDAiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmOyBib3JkZXItcmFkaXVzOiAycHgiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cg==)
 *
 * @param {Object} props - Supabase icons props and any valid SVG attribute
 * @returns {JSX.Element} JSX Element
 *
 */
const ClickHouse = createSupabaseIcon(
  'ClickHouse',
  [
    [
      'path',
      {
        d: 'M3 3V21M7.5 3V21M12 3V21M16.5 3V21M21 10V14',
        stroke: 'currentColor',
        'stroke-width': '1.5',
        'stroke-linecap': 'round',
        key: '1ho44o',
      },
    ],
  ],
  { fill: 'none' },
);

export default ClickHouse;
