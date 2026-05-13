-- Migration 002: Add "Other" category + fix username generation
-- Run in the Supabase SQL editor after 001_notifications.sql has been applied.

-- Add "Other" as a catch-all category
INSERT INTO categories (name, slug)
VALUES ('Other', 'other')
ON CONFLICT (slug) DO NOTHING;

-- Shorten auto-generated usernames to 8 chars (user1000–user9999).
-- The previous formula used the full UUID (37 chars), which exceeded the
-- 30-char limit enforced by the Settings page.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user' || (1000 + floor(random() * 9000)::int)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
