import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  role: text('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
})

export const countries = pgTable('countries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
})
