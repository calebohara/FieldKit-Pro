-- Add index on profiles.role for subscription queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- Add index on tool_usage for daily rate limiting
-- (idx_tool_usage_user_date already exists from 001, but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_tool_usage_user_date ON public.tool_usage (user_id, created_at);
