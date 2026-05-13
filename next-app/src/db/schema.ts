import { sqliteTable, text, integer, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';
export const users = sqliteTable('users', {
  id: text('id').notNull().primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: integer('email_verified', { mode: 'timestamp_ms' }),
  image: text('image'),
  password: text('password'),
});

export const accounts = sqliteTable('accounts', {
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  compoundKey: primaryKey({ columns: [table.provider, table.providerAccountId] }),
}));

export const sessions = sqliteTable('sessions', {
  sessionToken: text('sessionToken').notNull().primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
});

export const verificationTokens = sqliteTable('verificationTokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
}, (table) => ({
  compoundKey: primaryKey({ columns: [table.identifier, table.token] }),
}));

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  username: text('username').unique().notNull(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  favoriteTeam: text('favorite_team'),
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// ★ posts.id: 8자리 62진수 ShortID (TEXT)
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  content: text('content'),
  imageUrl: text('image_url'),
  teamTag: text('team_tag'),
  retweetId: text('retweet_id').references((): any => posts.id, { onDelete: 'set null' }),
  likesCount: integer('likes_count').default(0),
  retweetsCount: integer('retweets_count').default(0),
  commentsCount: integer('comments_count').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const likes = sqliteTable('likes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userPostUnique: uniqueIndex('likes_user_post_unique').on(table.userId, table.postId),
}));

export const retweets = sqliteTable('retweets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userPostUnique: uniqueIndex('retweets_user_post_unique').on(table.userId, table.postId),
}));

export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const follows = sqliteTable('follows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  followerId: text('follower_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  followingId: text('following_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  followerFollowingUnique: uniqueIndex('follows_unique').on(table.followerId, table.followingId),
}));

export const ads = sqliteTable('ads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  linkUrl: text('link_url'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  receiverId: text('receiver_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'like', 'retweet', 'comment', 'follow'
  postId: text('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profiles: one(profiles, {
    fields: [users.id],
    references: [profiles.id],
  }),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const profilesRelations = relations(profiles, ({ many }) => ({
  posts: many(posts),
  likes: many(likes),
  retweets: many(retweets),
  comments: many(comments),
  follows: many(follows, { relationName: 'follower' }),
  following: many(follows, { relationName: 'following' }),
  notifications: many(notifications, { relationName: 'receiver' }),
  sentNotifications: many(notifications, { relationName: 'sender' }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  profiles: one(profiles, {
    fields: [posts.userId],
    references: [profiles.id],
  }),
  likes: many(likes),
  retweets: many(retweets),
  comments: many(comments),
  notifications: many(notifications),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  profiles: one(profiles, {
    fields: [likes.userId],
    references: [profiles.id],
  }),
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
}));

export const retweetsRelations = relations(retweets, ({ one }) => ({
  profiles: one(profiles, {
    fields: [retweets.userId],
    references: [profiles.id],
  }),
  post: one(posts, {
    fields: [retweets.postId],
    references: [posts.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  profiles: one(profiles, {
    fields: [comments.userId],
    references: [profiles.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(profiles, {
    fields: [follows.followerId],
    references: [profiles.id],
    relationName: 'follower',
  }),
  following: one(profiles, {
    fields: [follows.followingId],
    references: [profiles.id],
    relationName: 'following',
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  receiver: one(profiles, {
    fields: [notifications.receiverId],
    references: [profiles.id],
    relationName: 'receiver',
  }),
  sender: one(profiles, {
    fields: [notifications.senderId],
    references: [profiles.id],
    relationName: 'sender',
  }),
  post: one(posts, {
    fields: [notifications.postId],
    references: [posts.id],
  }),
}));
