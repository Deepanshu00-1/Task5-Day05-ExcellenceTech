-- Complete setup for event registration system with fixed policy creation
-- Run this entire script in SQL Editor to set up all necessary functions and triggers

-- 1. Make sure the registered count can be incremented automatically when someone registers
CREATE OR REPLACE FUNCTION increment_registered_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the event is at capacity
  IF (SELECT registered FROM public.events WHERE id = NEW.event_id) >= 
     (SELECT capacity FROM public.events WHERE id = NEW.event_id) THEN
    RAISE EXCEPTION 'Event is at capacity';
  END IF;
  
  -- Increment registered count
  UPDATE public.events SET registered = registered + 1 WHERE id = NEW.event_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists to avoid errors
DROP TRIGGER IF EXISTS update_event_registration_count ON public.registrations;

-- Create the trigger to run the function when a new registration is added
CREATE TRIGGER update_event_registration_count
BEFORE INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION increment_registered_count();

-- 2. Ensure we can check if a user is already registered
CREATE OR REPLACE FUNCTION check_duplicate_registration()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.registrations 
    WHERE user_id = NEW.user_id AND event_id = NEW.event_id
  ) THEN
    RAISE EXCEPTION 'User is already registered for this event';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists to avoid errors
DROP TRIGGER IF EXISTS prevent_duplicate_registration ON public.registrations;

-- Create the trigger to prevent duplicate registrations
CREATE TRIGGER prevent_duplicate_registration
BEFORE INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION check_duplicate_registration();

-- 3. Create a test event if none exists (you can access this event directly)
INSERT INTO public.events (
  name, 
  description, 
  category, 
  date, 
  location,
  capacity, 
  registered, 
  is_featured,
  organizer_id
)
SELECT 
  'Test Event', 
  'This is a test event created by the SQL setup script.', 
  'workshop', 
  NOW() + INTERVAL '7 days', 
  'Test Location',
  50, 
  0, 
  TRUE,
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
WHERE 
  NOT EXISTS (SELECT 1 FROM public.events LIMIT 1);

-- 4. Location coordinates for map view
-- Add coordinates if missing from events (fixes map display issue)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS coordinates JSONB DEFAULT '{"lat": 40.7128, "lng": -74.0060}';

-- 5. Update existing events to have coordinates if they don't already
UPDATE public.events
SET coordinates = '{"lat": 40.7128, "lng": -74.0060}'
WHERE coordinates IS NULL OR coordinates = '{}';

-- 6. Create default profiles for users if they don't exist
INSERT INTO public.profiles (user_id, email, name)
SELECT 
  id, 
  email,
  email
FROM 
  auth.users u
WHERE 
  NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
  );

-- 7. Make sure we have RLS policies set up for registrations
-- This allows users to register for events
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- First drop existing policies to avoid errors when creating
DO $$
BEGIN
  -- Drop registration policies if they exist
  BEGIN
    DROP POLICY IF EXISTS "Registrations are viewable by event participants" ON public.registrations;
  EXCEPTION WHEN OTHERS THEN
    -- Do nothing if policy doesn't exist
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can register for events" ON public.registrations;
  EXCEPTION WHEN OTHERS THEN
    -- Do nothing if policy doesn't exist
  END;
  
  -- Drop event_comments policies if they exist
  BEGIN
    DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.event_comments;
  EXCEPTION WHEN OTHERS THEN
    -- Do nothing if policy doesn't exist
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can add comments" ON public.event_comments;
  EXCEPTION WHEN OTHERS THEN
    -- Do nothing if policy doesn't exist
  END;
END
$$;

-- Create policies without the "IF NOT EXISTS" clause
-- Everyone can view registrations (useful for showing who's attending)
CREATE POLICY "Registrations are viewable by event participants" 
  ON public.registrations FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.registrations WHERE event_id = event_id
    ) OR
    auth.uid() IN (
      SELECT organizer_id FROM public.events WHERE id = event_id
    )
  );

-- Users can register themselves for events
CREATE POLICY "Users can register for events"
  ON public.registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 8. Make event_comments accessible
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can view comments
CREATE POLICY "Comments are viewable by everyone"
  ON public.event_comments FOR SELECT
  USING (true);

-- Users can add comments
CREATE POLICY "Users can add comments"
  ON public.event_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 9. Update Google Maps API key (optional)
-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Add a placeholder for the Maps API key
-- Replace 'YOUR_API_KEY_HERE' with your actual key
INSERT INTO public.app_settings (key, value)
VALUES ('GOOGLE_MAPS_API_KEY', 'YOUR_API_KEY_HERE')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- 10. Show that setup is complete
SELECT 'Event registration system setup complete. You can now test the full flow.' as status; 