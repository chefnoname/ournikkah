import {
    boolean,
    integer,
    numeric,
    pgTable,
    serial,
    text,
    timestamp,
    varchar,
} from 'drizzle-orm/pg-core';

// ── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Workspaces ───────────────────────────────────────────────────────────────

export const workspaces = pgTable('workspaces', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().default(''),
  userName: varchar('user_name', { length: 255 }),
  partnerName: varchar('partner_name', { length: 255 }),
  baseLocation: varchar('base_location', { length: 255 }),
  ownerId: integer('owner_id').references(() => users.id),
  hasNikah: boolean('has_nikah').notNull().default(false),
  hasWalima: boolean('has_walima').notNull().default(false),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  currentStage: varchar('current_stage', { length: 50 }).notNull().default('planning'),
  nikahDate: varchar('nikah_date', { length: 50 }),
  walimaDate: varchar('walima_date', { length: 50 }),
  budgetRange: varchar('budget_range', { length: 50 }),
  guestCount: varchar('guest_count', { length: 50 }),
  totalBudget: numeric('total_budget', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Guest Tokens ─────────────────────────────────────────────────────────────

export const guestTokens = pgTable('guest_tokens', {
  id: serial('id').primaryKey(),
  token: varchar('token', { length: 64 }).notNull().unique(),
  workspaceId: integer('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

// ── Workspace Members ────────────────────────────────────────────────────────

export const workspaceMembers = pgTable('workspace_members', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// ── Workspace Invites (app invites, not wedding guests) ──────────────────────

export const workspaceInvites = pgTable('workspace_invites', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 32 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
});

// ── Vendor Items (global directory catalog) ──────────────────────────────────

export const vendorItems = pgTable('vendor_items', {
  id: serial('id').primaryKey(),
  section: varchar('section', { length: 20 }).notNull(),
  vendorCategory: varchar('vendor_category', { length: 50 }),
  title: varchar('title', { length: 255 }).notNull(),
  url: varchar('url', { length: 500 }),
  location: varchar('location', { length: 255 }),
  priceRange: varchar('price_range', { length: 50 }),
  imageUrls: text('image_urls').array().notNull().default([]),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  source: varchar('source', { length: 50 }).notNull().default('seed'),
  description: text('description'),
  bio: text('bio'),
  specialty: varchar('specialty', { length: 255 }),
  capacity: varchar('capacity', { length: 50 }),
  sisterFriendly: boolean('sister_friendly'),
  parking: boolean('parking'),
  disabilityAccessible: boolean('disability_accessible'),
  features: text('features').array().notNull().default([]),
  amenities: text('amenities').array().notNull().default([]),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Saved Vendors ────────────────────────────────────────────────────────────

export const savedVendors = pgTable('saved_vendors', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  vendorItemId: integer('vendor_item_id').notNull().references(() => vendorItems.id, { onDelete: 'cascade' }),
  contactStatus: varchar('contact_status', { length: 20 }).notNull().default('saved'),
  isFinalized: boolean('is_finalized').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Budget Items ─────────────────────────────────────────────────────────────

export const budgetItems = pgTable('budget_items', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 100 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull().default('0'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Guest Invites (wedding guest list) ───────────────────────────────────────

export const guestInvites = pgTable('guest_invites', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  guestName: varchar('guest_name', { length: 255 }).notNull(),
  rsvpStatus: varchar('rsvp_status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Notes ────────────────────────────────────────────────────────────────────

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull().default(''),
  updatedByEmail: varchar('updated_by_email', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
