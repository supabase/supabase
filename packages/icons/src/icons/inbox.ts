import createSupabaseIcon from '../createSupabaseIcon';

/**
 * @component @name Inbox
 * @description Supabase SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBzdHJva2U9IiMwMDAiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmOyBib3JkZXItcmFkaXVzOiAycHgiICAgIHN0cm9rZS13aWR0aD0iMS41Ij4KPHBhdGggZD0iTTIyIDE0SDE2TDE0IDE3SDEwTDggMTRIMk03LjI0IDZDNi44Njc5MiA2LjAwMDIgNi41MDMyNiA2LjEwNDE5IDYuMTg3MDQgNi4zMDAyOEM1Ljg3MDgzIDYuNDk2MzcgNS42MTU1OCA2Ljc3Njc5IDUuNDUgNy4xMUwyIDE0VjIwQzIgMjAuNTMwNCAyLjIxMDcxIDIxLjAzOTEgMi41ODU3OSAyMS40MTQyQzIuOTYwODYgMjEuNzg5MyAzLjQ2OTU3IDIyIDQgMjJIMjBDMjAuNTMwNCAyMiAyMS4wMzkxIDIxLjc4OTMgMjEuNDE0MiAyMS40MTQyQzIxLjc4OTMgMjEuMDM5MSAyMiAyMC41MzA0IDIyIDIwVjE0TDE4LjU1IDcuMTFDMTguMzg0NCA2Ljc3Njc5IDE4LjEyOTIgNi40OTYzNyAxNy44MTMgNi4zMDAyOEMxNy40OTY3IDYuMTA0MTkgMTcuMTMyMSA2LjAwMDIgMTYuNzYgNkg3LjI0WiIvPgo8L3N2Zz4K)
 *
 * @param {Object} props - Supabase icons props and any valid SVG attribute
 * @returns {JSX.Element} JSX Element
 *
 */
const Inbox = createSupabaseIcon(
  'Inbox',
  [
    [
      'path',
      {
        d: 'M22 14H16L14 17H10L8 14H2M7.24 6C6.86792 6.0002 6.50326 6.10419 6.18704 6.30028C5.87083 6.49637 5.61558 6.77679 5.45 7.11L2 14V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H20C20.5304 22 21.0391 21.7893 21.4142 21.4142C21.7893 21.0391 22 20.5304 22 20V14L18.55 7.11C18.3844 6.77679 18.1292 6.49637 17.813 6.30028C17.4967 6.10419 17.1321 6.0002 16.76 6H7.24Z',
        key: 'x6btcl',
      },
    ],
  ],
  { fill: 'none', stroke: 'currentColor', strokeWidth: '1.5' },
);

export default Inbox;
