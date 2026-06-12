import createSupabaseIcon from '../createSupabaseIcon';

/**
 * @component @name ClickHouse
 * @description Supabase SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNCAzVjIxTTkuMzMgM1YyMU0xNC42NyAzVjIxTTIwIDNWMjFNMTQuNjcgMTVIMjAiIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K)
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
        d: 'M4 3V21M9.33 3V21M14.67 3V21M20 3V21M14.67 15H20',
        stroke: 'currentColor',
        'stroke-width': '1.5',
        'stroke-linecap': 'round',
        key: 'j9858c',
      },
    ],
  ],
  { fill: 'none' },
);

export default ClickHouse;
