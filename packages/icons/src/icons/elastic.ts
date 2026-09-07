import createSupabaseIcon from '../createSupabaseIcon';

/**
 * @component @name Elastic
 * @description Supabase SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBmaWxsPSIjMEI2NEREIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMS4yIiBkPSJNMjcuNTY1IDExLjI0MmM1LjEgMS45NCA0Ljg3MiA5LjM5Ni0uMjQ1IDExLjEyN2wtLjE2Mi4wNTUtLjE2Ny0uMDM5LTUuMjgtMS4yMzgtLjI2OC0uMDYzLS4xMjctLjI0NC0xLjQtMi42OS0uMjE3LS40MTcuMzUyLS4zMSA2LjkwNC02LjA3LjI3Mi0uMjQuMzM4LjEzWiIvPgo8cGF0aCBmaWxsPSIjOUFEQzMwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMS4yIiBkPSJtMjIuMDQ3IDIxLjIzOSA0LjggMS4xMjUuMzE2LjA3NC4xMS4zMDQuMDY2LjE5Yy42MjMgMS45NjQtLjI2IDMuNzgtMS42NTIgNC43OTctMS40MzQgMS4wNDgtMy41MSAxLjMyLTUuMTgyLjAyMmwtLjI5LS4yMjUuMDY5LS4zNjEgMS4wMzctNS40NTQuMTE3LS42MTUuNjEuMTQzWiIvPgo8cGF0aCBmaWxsPSIjMUJBOUY1IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMS4yIiBkPSJtNS4wMSA5LjYzIDUuMjY3IDEuMjU1LjI4My4wNjcuMTIyLjI2NCAxLjIzNSAyLjY1LjE4Ny40LS4zMjguMjk4LTYuNzMzIDYuMS0uMjcyLjI0OC0uMzQ1LS4xMzJDMS45MzkgMTkuODMuNzIgMTcuNDU2Ljc1MiAxNS4xNTNjLjAzMi0yLjMwOCAxLjMyMS00LjY0NCAzLjkzMi01LjUwOGwuMTYyLS4wNTQuMTY1LjAzOVoiLz4KPHBhdGggZmlsbD0iI0YwNEU5OCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEuMiIgZD0iTTYuMjgxIDQuMzJjMS40MTYtMS4wOCAzLjQ4LTEuMzg3IDUuMjIyLS4wNjlsLjI5Ny4yMjYtLjA3LjM2Ni0xLjA1MyA1LjQ3NC0uMTE4LjYxNS0uNjA5LS4xNDQtNC44LTEuMTM3LS4zMTYtLjA3NS0uMTEtLjMwNmMtLjcwOS0xLjk2Ny4xNDktMy44NzYgMS41NTctNC45NVoiLz4KPHBhdGggZmlsbD0iIzAyQkNCNyIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEuMiIgZD0ibTEyLjQ2NiAxNC40MzMgNy4wMyAzLjIxMS4xODguMDg2LjA5NS4xODMgMS41NTUgMi45ODUuMDk2LjE4NC0uMDQuMjA2LTEuMTY1IDYuMTAxLS4wMjQuMTIyLS4wNjguMTAzYy0yLjY4IDMuOTU4LTYuOTAyIDQuNzEtMTAuMjY4IDMuMjYtMy4zNTYtMS40NDctNS44MzQtNS4wNy01LjEyNi05LjczNmwuMDMzLS4yMS4xNTgtLjE0NCA2Ljg4NC02LjI1LjI5My0uMjY1LjM2LjE2NFoiLz4KPHBhdGggZmlsbD0iI0ZFQzUxNCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEuMiIgZD0iTTExLjg5MiA0LjQxQzE0LjQzOC42NzYgMTguNzQxLjEwNSAyMi4xMzQgMS41NGMzLjM5MiAxLjQzMyA1Ljk5IDQuOTIgNS4xMDIgOS4zNjJsLS4wMzkuMi0uMTUzLjEzMy03LjA2NiA2LjIxMy0uMjkzLjI1OC0uMzUzLS4xNjMtNy4wMDItMy4yMS0uMjAxLS4wOTMtLjA5NC0uMi0xLjM4LTIuOTg4LS4wODEtLjE3Ny4wMzctLjE5TDExLjggNC42MzNsLjAyMy0uMTIxLjA3LS4xMDJaIi8+Cjwvc3ZnPgo=)
 *
 * @param {Object} props - Supabase icons props and any valid SVG attribute
 * @returns {JSX.Element} JSX Element
 *
 */
const Elastic = createSupabaseIcon(
  'Elastic',
  [
    [
      'path',
      {
        fill: '#0B64DD',
        stroke: '#fff',
        'stroke-width': '1.2',
        d: 'M27.565 11.242c5.1 1.94 4.872 9.396-.245 11.127l-.162.055-.167-.039-5.28-1.238-.268-.063-.127-.244-1.4-2.69-.217-.417.352-.31 6.904-6.07.272-.24.338.13Z',
        key: 'el1',
      },
    ],
    [
      'path',
      {
        fill: '#9ADC30',
        stroke: '#fff',
        'stroke-width': '1.2',
        d: 'm22.047 21.239 4.8 1.125.316.074.11.304.066.19c.623 1.964-.26 3.78-1.652 4.797-1.434 1.048-3.51 1.32-5.182.022l-.29-.225.069-.361 1.037-5.454.117-.615.61.143Z',
        key: 'el2',
      },
    ],
    [
      'path',
      {
        fill: '#1BA9F5',
        stroke: '#fff',
        'stroke-width': '1.2',
        d: 'm5.01 9.63 5.267 1.255.283.067.122.264 1.235 2.65.187.4-.328.298-6.733 6.1-.272.248-.345-.132C1.939 19.83.72 17.456.752 15.153c.032-2.308 1.321-4.644 3.932-5.508l.162-.054.165.039Z',
        key: 'el3',
      },
    ],
    [
      'path',
      {
        fill: '#F04E98',
        stroke: '#fff',
        'stroke-width': '1.2',
        d: 'M6.281 4.32c1.416-1.08 3.48-1.387 5.222-.069l.297.226-.07.366-1.053 5.474-.118.615-.609-.144-4.8-1.137-.316-.075-.11-.306c-.709-1.967.149-3.876 1.557-4.95Z',
        key: 'el4',
      },
    ],
    [
      'path',
      {
        fill: '#02BCB7',
        stroke: '#fff',
        'stroke-width': '1.2',
        d: 'm12.466 14.433 7.03 3.211.188.086.095.183 1.555 2.985.096.184-.04.206-1.165 6.101-.024.122-.068.103c-2.68 3.958-6.902 4.71-10.268 3.26-3.356-1.447-5.834-5.07-5.126-9.736l.033-.21.158-.144 6.884-6.25.293-.265.36.164Z',
        key: 'el5',
      },
    ],
    [
      'path',
      {
        fill: '#FEC514',
        stroke: '#fff',
        'stroke-width': '1.2',
        d: 'M11.892 4.41C14.438.676 18.741.105 22.134 1.54c3.392 1.433 5.99 4.92 5.102 9.362l-.039.2-.153.133-7.066 6.213-.293.258-.353-.163-7.002-3.21-.201-.093-.094-.2-1.38-2.988-.081-.177.037-.19L11.8 4.633l.023-.121.07-.102Z',
        key: 'el6',
      },
    ],
  ],
  { fill: 'none', stroke: 'none', viewBox: '0 0 32 32' },
);

export default Elastic;
