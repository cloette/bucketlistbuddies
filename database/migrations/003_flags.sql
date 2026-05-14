-- Migration 003: flags table for content/user reporting

CREATE TABLE IF NOT EXISTS public.flags (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  idea_id        UUID        REFERENCES public.ideas(id) ON DELETE CASCADE,
  post_id        UUID        REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  comment_id     UUID        REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  target_user_id UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT flags_one_target CHECK (
    (idea_id IS NOT NULL)::int +
    (post_id IS NOT NULL)::int +
    (comment_id IS NOT NULL)::int +
    (target_user_id IS NOT NULL)::int = 1
  )
);

-- Prevent duplicate flags per reporter per target
CREATE UNIQUE INDEX IF NOT EXISTS flags_reporter_idea
  ON public.flags (reporter_id, idea_id)        WHERE idea_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS flags_reporter_post
  ON public.flags (reporter_id, post_id)        WHERE post_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS flags_reporter_comment
  ON public.flags (reporter_id, comment_id)     WHERE comment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS flags_reporter_user
  ON public.flags (reporter_id, target_user_id) WHERE target_user_id IS NOT NULL;

ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reporters can insert flags"
  ON public.flags FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reporters can view own flags"
  ON public.flags FOR SELECT
  USING (auth.uid() = reporter_id);
