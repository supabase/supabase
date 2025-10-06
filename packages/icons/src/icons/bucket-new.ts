import createSupabaseIcon from '../createSupabaseIcon';

/**
 * @component @name BucketNew
 * @description Supabase SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNNiA3QzYgNC4yIDguMiAyIDExIDJIMTNDMTUuOCAyIDE4IDQuMiAxOCA3IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgogIDxwYXRoIGQ9Ik00LjUgMTFIMTkuNSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KICA8cGF0aCBkPSJNNiAxMUw2LjggMjBDNi45IDIxLjEgNy45IDIyIDkgMjJIMTIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CiAgPHBhdGggZD0iTTE4IDE1LjAyNDlWMjIuMDI0OSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KICA8cGF0aCBkPSJNMTQuNSAxOC41MjQ5SDIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==)
 *
 * @param {Object} props - Supabase icons props and any valid SVG attribute
 * @returns {JSX.Element} JSX Element
 *
 */
const BucketNew = createSupabaseIcon('BucketNew', [
  [
    'path',
    {
      d: 'M6 7C6 4.2 8.2 2 11 2H13C15.8 2 18 4.2 18 7',
      key: 'bucket-handle',
    },
  ],
  [
    'path',
    {
      d: 'M4.5 11H19.5',
      key: 'bucket-top',
    },
  ],
  [
    'path',
    {
      d: 'M6 11L6.8 20C6.9 21.1 7.9 22 9 22H12',
      key: 'bucket-side',
    },
  ],
  [
    'path',
    {
      d: 'M18 15.0249V22.0249',
      key: 'plus-vertical',
    },
  ],
  [
    'path',
    {
      d: 'M14.5 18.5249H21.5',
      key: 'plus-horizontal',
    },
  ],
]);

export default BucketNew;
