import createSupabaseIcon from '../createSupabaseIcon';

/**
 * @component @name ClickHouse
 * @description Supabase SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwIiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjogI2ZmZjsgYm9yZGVyLXJhZGl1czogMnB4IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0zIDNWMjFNNy41IDNWMjFNMTIgM1YyMU0xNi41IDNWMjFNMjEgMTBWMTQiLz4KPC9zdmc+Cg==)
 *
 * @param {Object} props - Supabase icons props and any valid SVG attribute
 * @returns {JSX.Element} JSX Element
 *
 */
const ClickHouse = createSupabaseIcon(
  'ClickHouse',
  [['path', { d: 'M3 3V21M7.5 3V21M12 3V21M16.5 3V21M21 10V14', key: 'tw32au' }]],
  { fill: 'none', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round' },
);

export default ClickHouse;
