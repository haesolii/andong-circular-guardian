import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  category: text('category').notNull(),
  description: text('description').notNull().default(''),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  place: text('place').notNull(),
  status: text('status').notNull().default('접수'),
  photoKey: text('photo_key'),
  photoContentType: text('photo_content_type'),
  clientHash: text('client_hash'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => [
  index('idx_reports_created_at').on(table.createdAt),
  index('idx_reports_category_created_at').on(table.category, table.createdAt),
  index('idx_reports_status_created_at').on(table.status, table.createdAt),
  index('idx_reports_client_created_at').on(table.clientHash, table.createdAt),
]);
