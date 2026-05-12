-- Migration 001: notifications table + allow_dms on profiles
-- Run this in the Supabase SQL editor after schema.sql has been applied.

-- Allow users to disable incoming DMs
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allow_dms BOOLEAN NOT NULL DEFAULT true;

-- Notification type enum
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('idea_commented', 'comment_replied', 'dm_received');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  actor_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  idea_id    UUID REFERENCES ideas(id) ON DELETE CASCADE,
  post_id    UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: owner read"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications: owner update"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);
