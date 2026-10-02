import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  dailyGoalMl: integer("daily_goal_ml").notNull().default(3000),
  glassSizeMl: integer("glass_size_ml").notNull().default(250),
  reminderIntervalMins: integer("reminder_interval_mins").notNull().default(60),
  reminderStart: varchar("reminder_start", { length: 5 }).notNull().default("08:00"),
  reminderEnd: varchar("reminder_end", { length: 5 }).notNull().default("22:00"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  theme: varchar("theme", { length: 10 }).notNull().default("dark"),
  avatarTheme: varchar("avatar_theme", { length: 20 }).notNull().default("aqua"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const waterEntries = pgTable("water_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amountMl: integer("amount_ml").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DbUser = typeof users.$inferSelect;
export type DbWaterEntry = typeof waterEntries.$inferSelect;
