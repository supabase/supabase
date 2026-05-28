export type UserRow = {
  id: string
  name: string
  email: string
  emailVerified: string | null
  image: string
}

export const HERO_ROW_COUNT = 9
export const HERO_ROW_HEIGHT = 36
export const HERO_HEADER_HEIGHT = 36
export const HERO_GRID_HEIGHT = HERO_HEADER_HEIGHT + HERO_ROW_COUNT * HERO_ROW_HEIGHT

/** Fictional demo data only — no real user records. */
export const MOCK_USER_ROWS: UserRow[] = [
  {
    id: '00528d53-c761-4f76-bb27-e763d02ee185',
    name: 'MelvinTh17',
    email: 'melvinth17@example.com',
    emailVerified: null,
    image: 'https://example.com/avatars/demo-user-01.png',
  },
  {
    id: '0a8b3c21-d4e5-4f67-9a12-b8c7d6e5f4a3',
    name: 'Ayoub Bigharassine',
    email: 'ayoub.bigharassine@example.com',
    emailVerified: null,
    image: 'https://example.com/avatars/demo-user-02.png',
  },
  {
    id: '1b9c4d32-e5f6-4a78-0b23-c9d8e7f6a5b4',
    name: 'Alex Demo',
    email: 'alex.demo@example.com',
    emailVerified: '2026-02-01 00:01:01',
    image: 'https://example.com/avatars/demo-user-03.png',
  },
  {
    id: '2c0d5e43-f6a7-4b89-1c34-d0e9f8a7b6c5',
    name: 'Fynn Bauer',
    email: 'fynn.bauer@example.com',
    emailVerified: null,
    image: 'https://example.com/avatars/demo-user-04.png',
  },
  {
    id: '3d1e6f54-a7b8-4c9a-2d45-e1f0a9b8c7d6',
    name: 'Andrei Cojocari',
    email: 'andrei.cojocari@example.com',
    emailVerified: null,
    image: 'https://example.com/avatars/demo-user-05.png',
  },
  {
    id: '4e2f7a65-b8c9-4dab-3e56-f2a1b0c9d8e7',
    name: 'Eltaj Mammadzada',
    email: 'eltaj.mammadzada@example.com',
    emailVerified: null,
    image: 'https://example.com/avatars/demo-user-06.png',
  },
  {
    id: '5f3a8b76-c9da-4ebc-4f67-a3b2c1d0e9f8',
    name: 'emreozogul',
    email: 'emreozogul@example.com',
    emailVerified: null,
    image: 'https://example.com/avatars/demo-user-07.png',
  },
  {
    id: '6a4b9c87-daeb-4fcd-5a78-b4c3d2e1f0a9',
    name: 'hammadmasoodofficial',
    email: 'hammadmasoodofficial@example.com',
    emailVerified: null,
    image: 'https://example.com/avatars/demo-user-08.png',
  },
  {
    id: '7b5c0d98-ebfc-4ade-6b89-c5d4e3f2a1b0',
    name: 'Majid Vesal Azad',
    email: 'majid.vesal.azad@example.com',
    emailVerified: null,
    image: 'https://example.com/avatars/demo-user-09.png',
  },
]

export type ColumnDef = {
  key: keyof UserRow
  name: string
  format: string
  isPrimaryKey?: boolean
  minWidth?: number
  width?: number
}

export const USER_TABLE_COLUMNS: ColumnDef[] = [
  { key: 'id', name: 'id', format: 'text', isPrimaryKey: true, minWidth: 280 },
  { key: 'name', name: 'name', format: 'text', minWidth: 140 },
  { key: 'email', name: 'email', format: 'text', minWidth: 220 },
  { key: 'emailVerified', name: 'emailVerified', format: 'timestamp', minWidth: 180 },
  { key: 'image', name: 'image', format: 'text', minWidth: 320 },
]
