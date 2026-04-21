-- Run this SQL in your Supabase SQL Editor to ensure the points RPC exists
-- Go to: https://app.supabase.com → SQL Editor → New Query

-- Function to safely increment user points
CREATE OR REPLACE FUNCTION increment_user_points(user_id UUID, amount INT)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET points = COALESCE(points, 0) + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment answer upvotes
CREATE OR REPLACE FUNCTION increment_answer_upvotes(answer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE answers SET upvotes = COALESCE(upvotes, 0) + 1 WHERE id = answer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment post upvotes
CREATE OR REPLACE FUNCTION increment_post_upvotes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE qa_posts SET upvotes = COALESCE(upvotes, 0) + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment answer count on a post
CREATE OR REPLACE FUNCTION increment_answer_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE qa_posts SET answer_count = COALESCE(answer_count, 0) + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
