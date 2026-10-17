import createSupabaseIcon from '../createSupabaseIcon';

/**
 * @component @name SqlEditor
 * @description Supabase SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmOyBib3JkZXItcmFkaXVzOiAycHgiICAgIHN0cm9rZS13aWR0aD0iMS41Ij4KICAgIDxwYXRoCiAgICAgICAgZD0iTTcuODk4NDQgOC40MzQyTDExLjUwMDQgMTIuMDM1Nkw3Ljg5ODQ0IDE1LjYzNzVNMTIgMTUuMzI5MkgxNi41TTUgMjEuMTA1NUgxOUMyMC4xMDQ2IDIxLjEwNTUgMjEgMjAuMjEgMjEgMTkuMTA1NVY1LjEwNTQ3QzIxIDQuMDAwOSAyMC4xMDQ2IDMuMTA1NDcgMTkgMy4xMDU0N0g1QzMuODk1NDMgMy4xMDU0NyAzIDQuMDAwOSAzIDUuMTA1NDdWMTkuMTA1NUMzIDIwLjIxIDMuODk1NDMgMjEuMTA1NSA1IDIxLjEwNTVaIiAvPgo8L3N2Zz4=)
 *
 * @param {Object} props - Supabase icons props and any valid SVG attribute
 * @returns {JSX.Element} JSX Element
 *
 */
const SqlEditor = createSupabaseIcon(
  'SqlEditor',
  [
    [
      'path',
      {
        d: 'M7.89844 8.4342L11.5004 12.0356L7.89844 15.6375M12 15.3292H16.5M5 21.1055H19C20.1046 21.1055 21 20.21 21 19.1055V5.10547C21 4.0009 20.1046 3.10547 19 3.10547H5C3.89543 3.10547 3 4.0009 3 5.10547V19.1055C3 20.21 3.89543 21.1055 5 21.1055Z',
        key: 'orzc99',
      },
    ],
  ],
  { fill: 'none', stroke: 'currentColor', strokeWidth: '1.5' },
);

export default SqlEditor;
