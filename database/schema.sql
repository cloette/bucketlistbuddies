-- =============================================================================
-- BUCKET LIST BUDDIES — DATABASE SCHEMA
-- Run this in the Supabase SQL editor (once, on a fresh project).
-- =============================================================================


-- =============================================================================
-- TYPES
-- =============================================================================
CREATE TYPE list_visibility AS ENUM ('public', 'private');
CREATE TYPE content_status  AS ENUM ('active', 'hidden');


-- =============================================================================
-- TABLES
-- =============================================================================

-- Extends auth.users. Created automatically via trigger on signup.
CREATE TABLE profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username             TEXT UNIQUE,
  display_name         TEXT,
  avatar_url           TEXT,
  bio                  TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fixed category set, seeded in seed.sql.
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User-submitted idea catalog. Counts maintained by triggers — never update manually.
CREATE TABLE ideas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  category_id  UUID NOT NULL REFERENCES categories(id),
  country      TEXT NOT NULL DEFAULT 'anywhere',
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status       content_status NOT NULL DEFAULT 'active',
  add_count    INTEGER NOT NULL DEFAULT 0,
  save_count   INTEGER NOT NULL DEFAULT 0,
  forum_count  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One bucket list per user. Controls visibility of the whole list.
CREATE TABLE bucket_lists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  visibility list_visibility NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ideas a user has added to their bucket list.
CREATE TABLE bucket_list_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_list_id UUID NOT NULL REFERENCES bucket_lists(id) ON DELETE CASCADE,
  idea_id        UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  is_completed   BOOLEAN NOT NULL DEFAULT false,
  display_order  INTEGER NOT NULL DEFAULT 0,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bucket_list_id, idea_id)
);

-- Ideas a user has starred/saved for later.
CREATE TABLE saved_ideas (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  idea_id  UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, idea_id)
);

-- Discussion threads attached to an idea.
CREATE TABLE forum_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id       UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  status        content_status NOT NULL DEFAULT 'active',
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Replies on a forum post.
CREATE TABLE forum_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  status     content_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Two-party direct messages. DMs from blocked users are dropped server-side.
CREATE TABLE direct_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_message CHECK (sender_id <> recipient_id)
);

-- User-to-user blocks.
CREATE TABLE blocked_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id <> blocked_id)
);


-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_ideas_category        ON ideas(category_id);
CREATE INDEX idx_ideas_country         ON ideas(country);
CREATE INDEX idx_ideas_submitted_by    ON ideas(submitted_by);
CREATE INDEX idx_bucket_list_items_list ON bucket_list_items(bucket_list_id);
CREATE INDEX idx_bucket_list_items_idea ON bucket_list_items(idea_id);
CREATE INDEX idx_saved_ideas_user      ON saved_ideas(user_id);
CREATE INDEX idx_saved_ideas_idea      ON saved_ideas(idea_id);
CREATE INDEX idx_forum_posts_idea      ON forum_posts(idea_id);
CREATE INDEX idx_forum_posts_user      ON forum_posts(user_id);
CREATE INDEX idx_forum_comments_post   ON forum_comments(post_id);
CREATE INDEX idx_dm_sender             ON direct_messages(sender_id);
CREATE INDEX idx_dm_recipient          ON direct_messages(recipient_id);
CREATE INDEX idx_dm_conversation       ON direct_messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX idx_blocked_blocker       ON blocked_users(blocker_id);


-- =============================================================================
-- TRIGGER FUNCTIONS — count maintenance
-- (Counts on ideas/posts are maintained here; never touch them in app code.)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_idea_add_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ideas SET add_count = add_count + 1 WHERE id = NEW.idea_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ideas SET add_count = GREATEST(add_count - 1, 0) WHERE id = OLD.idea_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_bucket_list_items_add_count
  AFTER INSERT OR DELETE ON bucket_list_items
  FOR EACH ROW EXECUTE FUNCTION update_idea_add_count();

---

CREATE OR REPLACE FUNCTION update_idea_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ideas SET save_count = save_count + 1 WHERE id = NEW.idea_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ideas SET save_count = GREATEST(save_count - 1, 0) WHERE id = OLD.idea_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_saved_ideas_save_count
  AFTER INSERT OR DELETE ON saved_ideas
  FOR EACH ROW EXECUTE FUNCTION update_idea_save_count();

---

CREATE OR REPLACE FUNCTION update_idea_forum_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ideas SET forum_count = forum_count + 1 WHERE id = NEW.idea_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ideas SET forum_count = GREATEST(forum_count - 1, 0) WHERE id = OLD.idea_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_forum_posts_forum_count
  AFTER INSERT OR DELETE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION update_idea_forum_count();

---

CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_forum_comments_comment_count
  AFTER INSERT OR DELETE ON forum_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

---

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_forum_posts_updated_at
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- TRIGGER: auto-create profile row when a new auth user signs up
-- =============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user' || lpad(floor(random() * 9000000 + 1000000)::text, 7, '0')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_lists      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_ideas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users     ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: public read"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles: owner update"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- categories
CREATE POLICY "categories: public read"
  ON categories FOR SELECT USING (true);

-- ideas
CREATE POLICY "ideas: public read"
  ON ideas FOR SELECT USING (status = 'active' OR auth.uid() = submitted_by);

CREATE POLICY "ideas: authenticated insert"
  ON ideas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = submitted_by);

-- bucket_lists: owner always sees their own; others see public lists
CREATE POLICY "bucket_lists: owner read"
  ON bucket_lists FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bucket_lists: public read"
  ON bucket_lists FOR SELECT USING (visibility = 'public');

CREATE POLICY "bucket_lists: owner insert"
  ON bucket_lists FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bucket_lists: owner update"
  ON bucket_lists FOR UPDATE USING (auth.uid() = user_id);

-- bucket_list_items: readable if the parent list is owned by user or is public
CREATE POLICY "bucket_list_items: accessible list read"
  ON bucket_list_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bucket_lists bl
      WHERE bl.id = bucket_list_id
        AND (bl.user_id = auth.uid() OR bl.visibility = 'public')
    )
  );

CREATE POLICY "bucket_list_items: owner all"
  ON bucket_list_items FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bucket_lists bl
      WHERE bl.id = bucket_list_id AND bl.user_id = auth.uid()
    )
  );

-- saved_ideas
CREATE POLICY "saved_ideas: owner all"
  ON saved_ideas FOR ALL USING (auth.uid() = user_id);

-- forum_posts
CREATE POLICY "forum_posts: public read"
  ON forum_posts FOR SELECT USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "forum_posts: authenticated insert"
  ON forum_posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "forum_posts: owner update"
  ON forum_posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "forum_posts: owner delete"
  ON forum_posts FOR DELETE USING (auth.uid() = user_id);

-- forum_comments
CREATE POLICY "forum_comments: public read"
  ON forum_comments FOR SELECT USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "forum_comments: authenticated insert"
  ON forum_comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "forum_comments: owner delete"
  ON forum_comments FOR DELETE USING (auth.uid() = user_id);

-- direct_messages
CREATE POLICY "direct_messages: participant read"
  ON direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "direct_messages: sender insert"
  ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "direct_messages: recipient mark read"
  ON direct_messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- blocked_users
CREATE POLICY "blocked_users: blocker all"
  ON blocked_users FOR ALL USING (auth.uid() = blocker_id);
