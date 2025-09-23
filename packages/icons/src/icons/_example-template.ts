import createSupabaseIcon from '../createSupabaseIcon';

/**
 * @component @name ExampleTemplate
 * @description Supabase SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMy41IDEzaDYiIC8+CiAgPHBhdGggZD0ibTIgMTYgNC41LTkgNC41IDkiIC8+CiAgPHBhdGggZD0iTTE4IDd2OSIgLz4KICA8cGF0aCBkPSJtMTQgMTIgNCA0IDQtNCIgLz4KPC9zdmc+)
 *
 * @param {Object} props - Supabase icons props and any valid SVG attribute
 * @returns {JSX.Element} JSX Element
 *
 */
const ExampleTemplate = createSupabaseIcon('ExampleTemplate', [
  ['path', { d: 'M3.5 13h6', key: 'p1my2r' }],
  ['path', { d: 'm2 16 4.5-9 4.5 9', key: 'ndf0b3' }],
  ['path', { d: 'M18 7v9', key: 'pknjwm' }],
  ['path', { d: 'm14 12 4 4 4-4', key: 'buelq4' }],
]);

export default ExampleTemplate;
